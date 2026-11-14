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
import { SortControl } from "@/components/sort-control";
import { SouthPoleMap } from "@/components/south-pole-map";
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
import { sortRows, type SortKey } from "@/lib/sort";
import { HOURS_PER_DAY, YEAR, firstDayOfMonth } from "@/lib/time";
import { cn } from "@/lib/utils";

// Fetches one JSON file from public/data/. Throws if the file is missing.
async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("Could not load " + path + " (status " + response.status + ")");
  }
  return response.json();
}

// Joins the sites with their per-day totals: one row per site.
function buildRows(
  curatedSites: Site[],
  customSites: Site[],
  summaries: Record<string, DaySummary[]>,
): SiteRow[] {
  const rows: SiteRow[] = [];
  for (const site of curatedSites) {
    rows.push({ site: site, isCustom: false, days: summaries[site.id] ?? [] });
  }
  for (const site of customSites) {
    rows.push({ site: site, isCustom: true, days: summaries[site.id] ?? [] });
  }
  return rows;
}

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
      className={cn("rounded-lg border border-line bg-panel p-4", className)}
    >
      <h2 className="mb-2 text-sm font-medium text-bright">{title}</h2>
      {children}
    </section>
  );
}

export function Navigator() {
  // Data from public/data/.
  const [sites, setSites] = useState<Site[]>([]);
  const [summaries, setSummaries] = useState<Record<string, DaySummary[]>>({});
  const [hourlyBySite, setHourlyBySite] = useState<Record<string, Hourly>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Points the user added.
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);
  const [pickedPoint, setPickedPoint] = useState<PickedPoint | null>(null);

  // What the user is looking at.
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("power");

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

    try {
      const hourly = (await fetchJson("/data/sites/" + siteId + ".json")) as SiteHourly;
      setHourlyBySite((previous) => ({ ...previous, [siteId]: hourly }));
    } catch {
      // Forget the request so a later click can try again.
      requestedHourlyIds.current.delete(siteId);
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

        if (wasCancelled) {
          return;
        }
        setSites(loadedSites);
        setSummaries(loadedSummaries);

        // Start with the top row selected.
        const firstRows = sortRows(buildRows(loadedSites, [], loadedSummaries), "power", 0);
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

  // Showing another month also moves the selected hour to that month's first
  // hour, so the selection is always inside the month on screen.
  function changeMonth(month: number) {
    setVisibleMonth(month);
    setSelectedHour(firstDayOfMonth(month) * HOURS_PER_DAY);
  }

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
        source: "Entered by the user. Flat horizon, no terrain.",
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
    setCustomSites((previous) => previous.filter((site) => site.id !== siteId));
    // If the removed site was selected, fall back to the first curated site.
    if (selectedSiteId === siteId) {
      if (sites.length > 0) {
        selectSite(sites[0].id);
      } else {
        setSelectedSiteId(null);
      }
    }
  }

  const rows = sortRows(buildRows(sites, customSites, summaries), sortKey, visibleMonth);

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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-6 border-b border-line px-4 py-3">
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

      <main className="grid flex-1 grid-cols-[minmax(0,1fr)_380px] gap-4 p-4">
        <div className="flex flex-col gap-4">
          <Panel title="Sites" className="flex-1">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading sites.</p>
            )}
            {loadError !== null && (
              <p role="alert" className="text-sm text-bright">
                {loadError}
              </p>
            )}
            {!isLoading && loadError === null && (
              <SitesGrid
                rows={rows}
                visibleMonth={visibleMonth}
                selectedSiteId={selectedSiteId}
                selectedHour={selectedHour}
                hourlyBySite={hourlyBySite}
                onSelect={selectSiteAndHour}
                onRequestHourly={requestHourly}
                onRemoveCustom={removeCustomSite}
              />
            )}
          </Panel>

          <Panel title="Clearance">
            <ClearanceCharts
              row={selectedRow}
              hourly={selectedHourly}
              visibleMonth={visibleMonth}
              selectedHour={selectedHour}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Selected site">
            <SelectedSite
              row={selectedRow}
              hourly={selectedHourly}
              selectedHour={selectedHour}
            />
          </Panel>

          <Panel title="South pole" className="flex-1">
            <SouthPoleMap
              rows={rows}
              selectedSiteId={selectedSiteId}
              onSelectSite={selectSite}
              onPickPoint={(lat, lon) => setPickedPoint({ lat: lat, lon: lon })}
            />
          </Panel>

          <Panel title="Custom point">
            <CustomSiteForm
              pickedPoint={pickedPoint}
              customCount={customSites.length}
              error={customError}
              onAdd={addCustomSite}
            />
          </Panel>

          <Panel title="Legend">
            <Legend />
          </Panel>
        </div>
      </main>
    </div>
  );
}
