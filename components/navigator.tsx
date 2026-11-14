"use client";

// The whole page: it loads the data, holds what is selected, and hands each
// panel what it needs. The panels live in their own files next to this one.

import { useEffect, useRef, useState } from "react";

import { ClearanceCharts } from "@/components/clearance-charts";
import { CustomSiteForm } from "@/components/custom-site-form";
import { Legend } from "@/components/legend";
import { MonthChips } from "@/components/month-chips";
import { SelectedSite } from "@/components/selected-site";
import { SitesGrid } from "@/components/sites-grid";
import { SkyPanorama } from "@/components/sky-panorama";
import { SortControl } from "@/components/sort-control";
import { MapOverlay } from "@/components/map-overlay";
import { EDGE_LAT, SouthPoleMap } from "@/components/south-pole-map";
import { TimeControls } from "@/components/time-controls";
import {
  MAX_CUSTOM_SITES,
  type Hourly,
  type PickedPoint,
  type SiteRow,
} from "@/lib/app-types";
import { customSiteHourly, summarizeDays } from "@/lib/custom-site";
import type {
  DaySummary,
  Ephemeris,
  Site,
  SiteHourly,
  SiteSummary,
} from "@/lib/data";
import { REFERENCE_SITES } from "@/lib/reference-sites";
import { buildRows } from "@/lib/rows";
import type { SortKey } from "@/lib/sort";
import { HOURS_IN_YEAR, YEAR, monthOfHour, moveHourToMonth, stepHour } from "@/lib/time";
import { cn } from "@/lib/utils";

// Fetches one JSON file from public/data/. Throws if the file is missing.
async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("Could not load " + path + " (status " + response.status + ")");
  }
  return response.json();
}

// How long one hour of data stays on screen while time is playing. At 80 ms
// a lunar day (about 708 hours) takes a little under a minute.
const PLAY_STEP_MS = 80;

// A titled box. Every panel on the page uses it.
function Panel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn("rounded-lg border border-line bg-panel px-4 py-3", className)}
    >
      <h2 className="mb-1.5 text-sm font-medium text-bright">{title}</h2>
      {children}
    </section>
  );
}

export function Navigator() {
  // Data from public/data/.
  const [sites, setSites] = useState<Site[]>([]);
  const [summaries, setSummaries] = useState<Record<string, DaySummary[]>>({});
  const [hourlyBySite, setHourlyBySite] = useState<Record<string, Hourly>>({});
  // Sites whose hourly file failed to load. Selecting the site again retries.
  const [failedHourlyIds, setFailedHourlyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Real past landings elsewhere on the Moon. Empty until their Sun and Earth
  // hours have been worked out from the ephemeris.
  const [referenceSites, setReferenceSites] = useState<Site[]>([]);

  // Points the user added.
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);
  const [pickedPoint, setPickedPoint] = useState<PickedPoint | null>(null);

  // What the user is looking at.
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState(0);
  // The month on screen is always the month of the selected hour.
  const visibleMonth = monthOfHour(selectedHour);
  // True while the play button is running time forward.
  const [isPlaying, setIsPlaying] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("power");
  // The big zoomable map is open.
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Things to remember that should not redraw the page when they change.
  const requestedHourlyIds = useRef<Set<string>>(new Set());
  const ephemerisCache = useRef<Ephemeris | null>(null);
  const nextCustomNumber = useRef(1);

  // Loads one curated site's hourly file, unless it was asked for before.
  // Custom sites never need this: their hourly data is made when they are added.
  async function requestHourly(siteId: string) {
    if (requestedHourlyIds.current.has(siteId)) {
      return;
    }
    requestedHourlyIds.current.add(siteId);
    setFailedHourlyIds((previous) => previous.filter((id) => id !== siteId));

    try {
      const hourly = (await fetchJson("/data/sites/" + siteId + ".json")) as SiteHourly;
      setHourlyBySite((previous) => ({ ...previous, [siteId]: hourly }));
    } catch {
      // Forget the request so a later click can try again, and say it failed.
      requestedHourlyIds.current.delete(siteId);
      setFailedHourlyIds((previous) => [...previous, siteId]);
    }
  }

  // Load the site list and every site's per-day totals once, at the start.
  useEffect(() => {
    let wasCancelled = false;

    async function loadSitesAndSummaries() {
      try {
        const loadedSites = (await fetchJson("/data/sites.json")) as Site[];
        const summaryFiles = (await Promise.all(
          loadedSites.map((site) => fetchJson("/data/summary/" + site.id + ".json")),
        )) as SiteSummary[];

        const loadedSummaries: Record<string, DaySummary[]> = {};
        for (const file of summaryFiles) {
          loadedSummaries[file.id] = file.days;
        }

        // The reference landings have no data files. Work out their hours
        // from the ephemeris, the same way as a custom point.
        const ephemeris = (await fetchJson("/data/ephemeris.json")) as Ephemeris;
        const referenceHourly: Record<string, Hourly> = {};
        for (const site of REFERENCE_SITES) {
          const hourly = customSiteHourly(site.lat, site.lon, ephemeris);
          referenceHourly[site.id] = hourly;
          loadedSummaries[site.id] = summarizeDays(
            ephemeris.start_utc,
            hourly.sun_elev_deg,
            hourly.sun_visible,
            hourly.earth_visible,
          );
        }

        if (wasCancelled) {
          return;
        }
        ephemerisCache.current = ephemeris;
        for (const site of REFERENCE_SITES) {
          // Their hourly data is already here, so it never needs to be fetched.
          requestedHourlyIds.current.add(site.id);
        }
        setSites(loadedSites);
        setReferenceSites(REFERENCE_SITES);
        setSummaries(loadedSummaries);
        setHourlyBySite((previous) => ({ ...previous, ...referenceHourly }));

        // Start with the top row selected.
        const firstRows = buildRows(loadedSites, [], [], loadedSummaries, "power", 0);
        if (firstRows.length > 0) {
          setSelectedSiteId(firstRows[0].site.id);
          requestHourly(firstRows[0].site.id);
        }
      } catch {
        if (!wasCancelled) {
          setLoadError("Could not load the site data. Reload the page to try again.");
        }
      } finally {
        if (!wasCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSitesAndSummaries();
    return () => {
      wasCancelled = true;
    };
  }, []);

  // Selecting a site also asks for its hourly data, which the charts and the
  // countdowns need. The selected hour stays as it is.
  function selectSite(siteId: string) {
    setSelectedSiteId(siteId);
    requestHourly(siteId);
  }

  function selectSiteAndHour(siteId: string, hour: number) {
    selectSite(siteId);
    setSelectedHour(hour);
  }

  // Showing another month moves the selected hour into that month, on the
  // same day of the month and hour of the day.
  function changeMonth(month: number) {
    setSelectedHour(moveHourToMonth(selectedHour, month));
  }

  // While playing, move one hour forward every PLAY_STEP_MS. Each new hour
  // starts the next wait, and the last hour of the year stops the play.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = setTimeout(() => {
      if (selectedHour >= HOURS_IN_YEAR - 1) {
        setIsPlaying(false);
      } else {
        setSelectedHour(selectedHour + 1);
      }
    }, PLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, selectedHour]);

  // The left and right arrow keys step one hour, unless the user is typing in
  // a field (the slider handles its own arrow keys).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";
      if (isTyping) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedHour((previous) => stepHour(previous, 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedHour((previous) => stepHour(previous, -1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Works out a custom point's hourly data and per-day totals in the browser,
  // then adds it as a site. The form checks the numbers before calling this.
  async function addCustomSite(lat: number, lon: number) {
    if (customSites.length >= MAX_CUSTOM_SITES) {
      return;
    }
    setCustomError(null);

    try {
      if (ephemerisCache.current === null) {
        ephemerisCache.current = (await fetchJson("/data/ephemeris.json")) as Ephemeris;
      }
      const ephemeris = ephemerisCache.current;

      const hourly = customSiteHourly(lat, lon, ephemeris);
      const days = summarizeDays(
        ephemeris.start_utc,
        hourly.sun_elev_deg,
        hourly.sun_visible,
        hourly.earth_visible,
      );

      const id = "custom-" + nextCustomNumber.current;
      nextCustomNumber.current += 1;
      // The hourly data is already here, so it never needs to be fetched.
      requestedHourlyIds.current.add(id);

      const site: Site = {
        id: id,
        name: "Custom " + lat.toFixed(2) + ", " + lon.toFixed(2),
        lat: lat,
        lon: lon,
        elevation_m: 0,
        source: "Entered by the user. Smooth Moon, no terrain.",
      };

      setCustomSites((previous) => [...previous, site]);
      setSummaries((previous) => ({ ...previous, [id]: days }));
      setHourlyBySite((previous) => ({ ...previous, [id]: hourly }));
      setSelectedSiteId(id);
      setPickedPoint(null);
    } catch {
      setCustomError("Could not load the Sun and Earth positions. Try again.");
    }
  }

  function removeCustomSite(siteId: string) {
    // Update from "previous", so two quick removals never undo each other.
    setCustomSites((previous) => previous.filter((site) => site.id !== siteId));

    // Forget its per-day totals and hourly data too.
    setSummaries((previous) => {
      const copy = { ...previous };
      delete copy[siteId];
      return copy;
    });
    setHourlyBySite((previous) => {
      const copy = { ...previous };
      delete copy[siteId];
      return copy;
    });
    requestedHourlyIds.current.delete(siteId);

    // If the removed site was selected, select the top row on screen instead.
    if (selectedSiteId === siteId) {
      const remainingCustomSites = customSites.filter((site) => site.id !== siteId);
      const remainingRows = buildRows(
        sites,
        referenceSites,
        remainingCustomSites,
        summaries,
        sortKey,
        visibleMonth,
      );
      if (remainingRows.length > 0) {
        selectSite(remainingRows[0].site.id);
      } else {
        setSelectedSiteId(null);
      }
    }
  }

  const rows = buildRows(sites, referenceSites, customSites, summaries, sortKey, visibleMonth);
  // The map only reaches EDGE_LAT, so sites further north are left off it.
  const mapRows = rows.filter((row) => row.site.lat <= EDGE_LAT);

  let selectedRow: SiteRow | null = null;
  for (const row of rows) {
    if (row.site.id === selectedSiteId) {
      selectedRow = row;
    }
  }

  let selectedHourly: Hourly | null = null;
  if (selectedSiteId !== null && hourlyBySite[selectedSiteId] !== undefined) {
    selectedHourly = hourlyBySite[selectedSiteId];
  }
  const selectedHourlyFailed =
    selectedSiteId !== null && failedHourlyIds.includes(selectedSiteId);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-6 border-b border-line px-4 py-2">
        <h1 className="text-lg font-medium text-bright">
          Lunar Landing Site Navigator
        </h1>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {YEAR}
          </span>
          <MonthChips
            visibleMonth={visibleMonth}
            selectedRow={selectedRow}
            onChangeMonth={changeMonth}
          />
        </div>

        <div className="ml-auto">
          <SortControl sortKey={sortKey} onChangeSort={setSortKey} />
        </div>
      </header>

      {/* The page is exactly one screen tall. Each column fills the space under
          the header: the Sites panel and the map take what the other panels
          leave, so the rows and the map shrink instead of the page scrolling. */}
      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_380px] grid-rows-[minmax(0,1fr)] gap-3 p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <Panel title="Sites" className="flex min-h-0 flex-1 flex-col">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading sites.</p>
            )}
            {loadError !== null && (
              <p role="alert" className="text-sm text-bright">
                {loadError}
              </p>
            )}
            {!isLoading && loadError === null && (
              <>
                <SitesGrid
                  rows={rows}
                  visibleMonth={visibleMonth}
                  selectedSiteId={selectedSiteId}
                  selectedHour={selectedHour}
                  hourlyBySite={hourlyBySite}
                  failedHourlyIds={failedHourlyIds}
                  onSelect={selectSiteAndHour}
                  onRequestHourly={requestHourly}
                  onRemoveCustom={removeCustomSite}
                />
                <Legend />
              </>
            )}
          </Panel>

          {/* The selected site's numbers sit next to its charts: both are
              about the same site and hour. */}
          <Panel title="Selected site">
            {/* Numbers on the left, the sky and the charts on the right. */}
            <div className="grid grid-cols-[23rem_minmax(0,1fr)] gap-6">
              <SelectedSite
                row={selectedRow}
                hourly={selectedHourly}
                hourlyFailed={selectedHourlyFailed}
                selectedHour={selectedHour}
              />
              {/* The time controls, then the sky at the selected hour, then
                  the month's clearance charts. */}
              <div className="flex min-w-0 flex-col gap-1">
                {selectedHourly !== null && (
                  <TimeControls
                    visibleMonth={visibleMonth}
                    selectedHour={selectedHour}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onChangeHour={setSelectedHour}
                  />
                )}
                <SkyPanorama
                  row={selectedRow}
                  hourly={selectedHourly}
                  visibleMonth={visibleMonth}
                  selectedHour={selectedHour}
                />
                <ClearanceCharts
                  row={selectedRow}
                  hourly={selectedHourly}
                  hourlyFailed={selectedHourlyFailed}
                  visibleMonth={visibleMonth}
                  selectedHour={selectedHour}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex min-h-0 flex-col gap-3">

          <Panel title="South pole" className="flex min-h-0 flex-1 flex-col">
            {/* The small map is a locator: pins select, anything else opens
                the big map, where points are picked. */}
            <div className="relative min-h-0 flex-1 cursor-zoom-in">
              <SouthPoleMap
                rows={mapRows}
                selectedSiteId={selectedSiteId}
                pickedPoint={pickedPoint}
                onSelectSite={selectSite}
                onEmptyClick={() => setIsMapOpen(true)}
                emptyClickHint="Click empty ground to open the big map and pick a point."
              />
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="absolute top-0 right-0 rounded-md bg-neither px-2.5 py-1 text-sm text-bright"
              >
                Zoom in
              </button>
            </div>
          </Panel>

          <Panel title="Custom point">
            <CustomSiteForm
              pickedPoint={pickedPoint}
              customCount={customSites.length}
              error={customError}
              onAdd={addCustomSite}
            />
          </Panel>
        </div>
      </main>

      {isMapOpen && (
        <MapOverlay
          rows={mapRows}
          selectedSiteId={selectedSiteId}
          pickedPoint={pickedPoint}
          isCustomFull={customSites.length >= MAX_CUSTOM_SITES}
          onSelectSite={selectSite}
          onPickPoint={(lat, lon) => setPickedPoint({ lat: lat, lon: lon })}
          onAddPoint={(lat, lon) => {
            addCustomSite(lat, lon);
            setIsMapOpen(false);
          }}
          onClose={() => setIsMapOpen(false)}
        />
      )}
    </div>
  );
}
