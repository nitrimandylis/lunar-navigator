"use client";

// The whole page: it loads the data, holds what is selected, and hands each
// panel what it needs. The panels live in their own files next to this one.

import { useEffect, useRef, useState } from "react";

import { AboutOverlay } from "@/components/about-overlay";
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
import { TourCard } from "@/components/tour-card";
import { WholeMoonMap } from "@/components/whole-moon-map";
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
import {
  HOURS_IN_YEAR,
  HOURS_PER_DAY,
  YEAR,
  firstDayOfMonth,
  monthOfHour,
  moveHourToMonth,
  stepHour,
} from "@/lib/time";
import { TOUR_STEPS } from "@/lib/tour";
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

// A titled box. Every panel on the page uses it. The caption is one plain
// sentence, next to the title, that says what the panel shows.
function Panel({
  title,
  caption,
  isHighlighted,
  className,
  children,
}: {
  title: string;
  caption: string;
  // True while the guided tour points at this panel.
  isHighlighted: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-lg border border-line bg-panel px-4 py-3",
        isHighlighted && "ring-2 ring-bright",
        className,
      )}
    >
      {/* On a narrow screen a long caption wraps under the title. From lg up
          it stays on the title's line and is cut short. */}
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 lg:flex-nowrap lg:gap-3">
        <h2 className="shrink-0 text-sm font-medium text-bright">{title}</h2>
        <p className="min-w-0 text-xs text-muted-foreground lg:truncate" title={caption}>
          {caption}
        </p>
      </div>
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
  // Where the Sun and Earth are overhead, hour by hour. null until it has
  // loaded. It is kept in state so the whole Moon map redraws when it arrives.
  const [ephemeris, setEphemeris] = useState<Ephemeris | null>(null);

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
  // The map panel shows the whole Moon instead of the south pole. It only
  // changes when the user presses one of the panel's two buttons.
  const [isWholeMoon, setIsWholeMoon] = useState(false);
  // The big zoomable map is open.
  const [isMapOpen, setIsMapOpen] = useState(false);
  // The About panel is open.
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  // The step of the guided tour on screen, or null when the tour is closed.
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);

  // Things to remember that should not redraw the page when they change.
  const requestedHourlyIds = useRef<Set<string>>(new Set());
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
        const loadedEphemeris = (await fetchJson("/data/ephemeris.json")) as Ephemeris;
        const referenceHourly: Record<string, Hourly> = {};
        for (const site of REFERENCE_SITES) {
          const hourly = customSiteHourly(site.lat, site.lon, loadedEphemeris);
          referenceHourly[site.id] = hourly;
          loadedSummaries[site.id] = summarizeDays(
            loadedEphemeris.start_utc,
            hourly.sun_elev_deg,
            hourly.sun_visible,
            hourly.earth_visible,
          );
        }

        if (wasCancelled) {
          return;
        }
        setEphemeris(loadedEphemeris);
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
      // Leave browser shortcuts alone: Cmd or Alt with an arrow goes back a page.
      if (event.ctrlKey || event.metaKey || event.altKey) {
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

  // Shows one step of the guided tour and puts the page in the state its text
  // talks about: the site, the first hour of the month, and playing or not.
  function showTourStep(index: number) {
    const step = TOUR_STEPS[index];
    setTourStepIndex(index);
    setSortKey("power");
    selectSite(step.siteId);
    setSelectedHour(firstDayOfMonth(step.month) * HOURS_PER_DAY);
    setIsPlaying(step.isPlaying);
  }

  function closeTour() {
    setTourStepIndex(null);
    setIsPlaying(false);
  }

  // Works out a custom point's hourly data and per-day totals in the browser,
  // then adds it as a site. The form checks the numbers before calling this.
  async function addCustomSite(lat: number, lon: number) {
    if (customSites.length >= MAX_CUSTOM_SITES) {
      return;
    }
    setCustomError(null);

    try {
      // The ephemeris is normally here already, loaded with the sites. It is
      // only fetched now if that first load failed.
      let loadedEphemeris = ephemeris;
      if (loadedEphemeris === null) {
        loadedEphemeris = (await fetchJson("/data/ephemeris.json")) as Ephemeris;
        setEphemeris(loadedEphemeris);
      }

      const hourly = customSiteHourly(lat, lon, loadedEphemeris);
      const days = summarizeDays(
        loadedEphemeris.start_utc,
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
  // The whole Moon map draws the past landings and the custom points. The
  // curated sites all sit at its bottom edge, so it shows them as one strip.
  const wholeMoonRows = rows.filter((row) => row.isReference || row.isCustom);

  // The map panel's title and caption say which map is on screen.
  let mapTitle = "South pole";
  let mapCaption = "Seen from above. Earth is towards the top.";
  if (isWholeMoon) {
    mapTitle = "Whole Moon";
    mapCaption = "Unrolled flat. Shaded: night right now.";
  }

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

  // The part of the page the guided tour points at, or null.
  let tourTarget: string | null = null;
  if (tourStepIndex !== null) {
    tourTarget = TOUR_STEPS[tourStepIndex].target;
  }

  return (
    // Below lg (1024 px) the page is as tall as its panels and scrolls. From lg
    // up it is exactly one screen tall.
    <div className="flex flex-col lg:h-dvh">
      {/* On a narrow screen the header wraps onto as many lines as it needs. */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-2 lg:flex-nowrap lg:gap-6">
        <h1 className="text-lg font-medium text-bright">
          Lunar Landing Site Navigator
        </h1>

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg",
            tourTarget === "months" && "ring-2 ring-bright ring-offset-4 ring-offset-background",
          )}
        >
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {YEAR}
          </span>
          <MonthChips
            visibleMonth={visibleMonth}
            selectedRow={selectedRow}
            onChangeMonth={changeMonth}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:ml-auto lg:flex-nowrap lg:gap-4">
          <SortControl sortKey={sortKey} onChangeSort={setSortKey} />
          {/* min-h-10 makes the header buttons 40 px tall, big enough for a thumb. */}
          <button
            type="button"
            onClick={() => showTourStep(0)}
            className="min-h-10 rounded-md bg-bright px-2.5 py-1 text-sm font-medium text-background lg:min-h-0"
          >
            Take the tour
          </button>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="min-h-10 rounded-md bg-neither px-2.5 py-1 text-sm text-bright lg:min-h-0"
          >
            About
          </button>
        </div>
      </header>

      {/* Below lg the panels stack in one column, in the order they are written
          here: Sites, Selected site, South pole, Custom point.
          From lg up the page is exactly one screen tall. Each column fills the
          space under the header: the Sites panel and the map take what the other
          panels leave, so the rows and the map shrink instead of the page scrolling. */}
      <main className="flex flex-col gap-3 p-3 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex flex-col gap-3 lg:min-h-0">
          <Panel
            title="Sites"
            caption="Each row is a place, each square a day: orange for sunlight, blue for Earth in view."
            isHighlighted={tourTarget === "sites"}
            // Stacked, a tooltip near the right edge is cut off at the panel's
            // side, so it never makes the page scroll sideways.
            className="flex flex-col overflow-x-clip lg:min-h-0 lg:flex-1 lg:overflow-x-visible"
          >
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
          <Panel
            title="Selected site"
            caption="One place at one hour: where the Sun and Earth are, and how long they stay."
            isHighlighted={tourTarget === "selected"}
          >
            {/* Numbers on the left, the sky and the charts on the right. On a
                narrow screen the numbers sit above the sky and the charts. */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[23rem_minmax(0,1fr)]">
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
                    onTogglePlay={() => setIsPlaying((playing) => !playing)}
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

        <div className="flex flex-col gap-3 lg:min-h-0">

          <Panel
            title={mapTitle}
            caption={mapCaption}
            isHighlighted={false}
            className="flex flex-col lg:min-h-0 lg:flex-1"
          >
            {/* Two buttons choose which map the panel shows. They look like the
                sort buttons in the header: the one in use has a bright ring,
                and min-h-10 makes them 40 px tall on a narrow screen. */}
            <div role="group" aria-label="Map view" className="mb-2 flex items-center gap-2">
              <button
                type="button"
                aria-pressed={!isWholeMoon}
                onClick={() => setIsWholeMoon(false)}
                className={cn(
                  "min-h-10 rounded-md bg-neither px-2.5 py-1 text-sm lg:min-h-0",
                  !isWholeMoon && "font-medium text-bright ring-2 ring-bright",
                )}
              >
                South pole
              </button>
              <button
                type="button"
                aria-pressed={isWholeMoon}
                onClick={() => setIsWholeMoon(true)}
                className={cn(
                  "min-h-10 rounded-md bg-neither px-2.5 py-1 text-sm lg:min-h-0",
                  isWholeMoon && "font-medium text-bright ring-2 ring-bright",
                )}
              >
                Whole Moon
              </button>
            </div>
            {/* The small map is a locator: pins select, anything else opens
                the big map, where points are picked. Stacked, the grid no
                longer gives the south pole map a height, so it is a square as
                wide as the panel, at most 480 px tall. The whole Moon map
                only selects: it has no big version, so no zoom cursor, and
                stacked it takes its height from its own width. */}
            <div
              className={cn(
                "relative lg:min-h-0 lg:flex-1",
                !isWholeMoon &&
                  "aspect-square max-h-[480px] cursor-zoom-in lg:aspect-auto lg:max-h-none",
              )}
            >
              {!isWholeMoon && (
                <>
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
                </>
              )}
              {isWholeMoon && (
                <WholeMoonMap
                  rows={wholeMoonRows}
                  selectedSiteId={selectedSiteId}
                  ephemeris={ephemeris}
                  selectedHour={selectedHour}
                  onSelectSite={selectSite}
                  onShowSouthPole={() => setIsWholeMoon(false)}
                />
              )}
            </div>
          </Panel>

          <Panel title="Custom point" caption="Try any place on the Moon." isHighlighted={false}>
            <CustomSiteForm
              pickedPoint={pickedPoint}
              customCount={customSites.length}
              error={customError}
              onAdd={addCustomSite}
            />
          </Panel>
        </div>
      </main>

      {isAboutOpen && <AboutOverlay onClose={() => setIsAboutOpen(false)} />}

      {tourStepIndex !== null && (
        <TourCard
          step={TOUR_STEPS[tourStepIndex]}
          stepIndex={tourStepIndex}
          stepCount={TOUR_STEPS.length}
          onBack={() => showTourStep(tourStepIndex - 1)}
          onNext={() => showTourStep(tourStepIndex + 1)}
          onClose={closeTour}
        />
      )}

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
