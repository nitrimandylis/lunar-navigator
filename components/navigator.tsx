"use client";

// The whole page: it loads the data, holds what is selected, and hands each
// panel what it needs. The panels live in their own files next to this one.

import { useEffect, useRef, useState } from "react";

import { AboutOverlay } from "@/components/about-overlay";
import { ClearanceCharts } from "@/components/clearance-charts";
import { CustomSiteForm } from "@/components/custom-site-form";
import { Legend } from "@/components/legend";
import { MissionPlanner } from "@/components/mission-planner";
import { MonthChips } from "@/components/month-chips";
import { SelectedSite } from "@/components/selected-site";
import { SiteActions } from "@/components/site-actions";
import { SitesGrid } from "@/components/sites-grid";
import { SkyPanorama } from "@/components/sky-panorama";
import { SortControl } from "@/components/sort-control";
import { MapOverlay } from "@/components/map-overlay";
import { EDGE_LAT, SouthPoleMap } from "@/components/south-pole-map";
import { TimeControls } from "@/components/time-controls";
import { TourCard } from "@/components/tour-card";
import { YearPicker } from "@/components/year-picker";
import {
  MAX_CUSTOM_SITES,
  type Hourly,
  type PickedPoint,
  type SiteRow,
} from "@/lib/app-types";
import { customSiteHourly, summarizeDays } from "@/lib/custom-site";
import {
  dataFolder,
  joinEphemeris,
  joinHourly,
  type DaySummary,
  type Ephemeris,
  type Site,
  type SiteHourly,
  type SiteSummary,
} from "@/lib/data";
import { REFERENCE_SITES } from "@/lib/reference-sites";
import { buildRows } from "@/lib/rows";
import { parseShareQuery } from "@/lib/share";
import type { SortKey } from "@/lib/sort";
import {
  HOURS_PER_DAY,
  MONTHS_PER_YEAR,
  TOTAL_HOURS,
  YEARS,
  firstDayOfMonth,
  firstMonthOfYear,
  monthOfHour,
  moveHourToMonth,
  stepHour,
  yearOfMonth,
} from "@/lib/time";
import { TOUR_STEPS } from "@/lib/tour";
import { MISSION_PRESETS } from "@/lib/windows";
import { cn } from "@/lib/utils";

// Fetches one JSON file from public/data/. Throws if the file is missing.
async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("Could not load " + path + " (status " + response.status + ")");
  }
  return response.json();
}

// Fetches the same file for every year and returns the parts in year order.
// file is a path inside a year's folder, for example "summary/<id>.json".
async function fetchEveryYear(file: string): Promise<unknown[]> {
  return Promise.all(YEARS.map((year) => fetchJson(dataFolder(year) + file)));
}

// The Sun and Earth sub-points for every hour of every year, as one file.
async function fetchEphemeris(): Promise<Ephemeris> {
  return joinEphemeris((await fetchEveryYear("ephemeris.json")) as Ephemeris[]);
}

// How long one hour of data stays on screen while time is playing. At 80 ms
// a lunar day (about 708 hours) takes a little under a minute.
const PLAY_STEP_MS = 80;

// The guided tour dims every part of the page it is not pointing at. Each part
// carries TOUR_FADE all the time, so it fades between lit and dimmed instead of
// jumping, and TOUR_DIM while it is dimmed. A dimmed part is also inert: it
// cannot be clicked or reached with the Tab key.
const TOUR_FADE = "transition-[opacity,box-shadow] duration-300 motion-reduce:transition-none";
const TOUR_DIM = "opacity-30";

// Below lg the page shows one of these at a time, picked in the tab bar at
// the bottom. From lg up every panel is on screen and the tabs are hidden.
type PhoneTab = "sites" | "site" | "map";

const PHONE_TABS: { tab: PhoneTab; label: string }[] = [
  { tab: "sites", label: "Sites" },
  { tab: "site", label: "Selected site" },
  { tab: "map", label: "Map" },
];

// A titled box. Every panel on the page uses it. The caption is one plain
// sentence, next to the title, that says what the panel shows.
function Panel({
  title,
  caption,
  isHighlighted,
  isDimmed,
  className,
  children,
}: {
  title: string;
  caption: string;
  // True while the guided tour points at this panel.
  isHighlighted: boolean;
  // True while the guided tour points somewhere else.
  isDimmed: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      inert={isDimmed}
      className={cn(
        "rounded-lg border border-line bg-panel px-4 py-3",
        TOUR_FADE,
        isHighlighted && "ring-2 ring-bright",
        isDimmed && TOUR_DIM,
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
  // The About panel is open.
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  // The mission planner is open.
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  // The mission preset the planner opens on.
  const [plannerPresetId, setPlannerPresetId] = useState(MISSION_PRESETS[0].id);
  // The step of the guided tour on screen, or null when the tour is closed.
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);
  // The panel on screen below lg. It opens on the selected site, so a visitor
  // sees the sky and the play button first.
  const [phoneTab, setPhoneTab] = useState<PhoneTab>("site");

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
      // One file per year, joined into one timeline.
      const parts = (await fetchEveryYear("sites/" + siteId + ".json")) as SiteHourly[];
      const hourly = joinHourly(parts);
      setHourlyBySite((previous) => ({ ...previous, [siteId]: hourly }));
      // The summary files cut a dark spell at the first and last hour of each
      // year. Work the per-day totals out again from the joined hours, so a
      // spell that crosses New Year is whole.
      const wholeDays = summarizeDays(
        hourly.start_utc,
        hourly.sun_elev_deg,
        hourly.sun_visible,
        hourly.earth_visible,
      );
      setSummaries((previous) => ({ ...previous, [siteId]: wholeDays }));
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
        // For each site, one summary file per year.
        const summaryParts = (await Promise.all(
          loadedSites.map((site) => fetchEveryYear("summary/" + site.id + ".json")),
        )) as SiteSummary[][];

        // Put each site's years one after the other, so day 0 is 1 January
        // 2027 and the days run on to the end of the last year.
        const loadedSummaries: Record<string, DaySummary[]> = {};
        for (const parts of summaryParts) {
          let days: DaySummary[] = [];
          for (const part of parts) {
            days = days.concat(part.days);
          }
          loadedSummaries[parts[0].id] = days;
        }

        // The reference landings have no data files. Work out their hours
        // from the ephemeris, the same way as a custom point.
        const ephemeris = await fetchEphemeris();
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

        // A share link names a site and an hour. Custom points are not in
        // links, so only curated sites and past landings count as known.
        const knownSiteIds: string[] = [];
        for (const site of loadedSites) {
          knownSiteIds.push(site.id);
        }
        for (const site of REFERENCE_SITES) {
          knownSiteIds.push(site.id);
        }
        const shared = parseShareQuery(window.location.search, knownSiteIds);
        if (shared.hour !== null) {
          setSelectedHour(shared.hour);
        }

        // Start with the shared site selected, or else the top row.
        const firstRows = buildRows(loadedSites, [], [], loadedSummaries, "power", 0);
        if (shared.siteId !== null) {
          setSelectedSiteId(shared.siteId);
          requestHourly(shared.siteId);
        } else if (firstRows.length > 0) {
          setSelectedSiteId(firstRows[0].site.id);
          requestHourly(firstRows[0].site.id);
        }

        // "?plan=rover" opens the planner on load. The sites state is not
        // set yet at this point, so the hourly data is asked for from the
        // loaded list. The tour and play are always off on load, so this
        // does not need the rest of openPlanner.
        if (shared.planPresetId !== null) {
          setPlannerPresetId(shared.planPresetId);
          setIsPlannerOpen(true);
          for (const site of loadedSites) {
            requestHourly(site.id);
          }
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

  // Switches the panel on screen below lg and goes back to the top of the
  // page. From lg up the tabs are hidden and the page never scrolls, so this
  // changes nothing there.
  function showTab(tab: PhoneTab) {
    setPhoneTab(tab);
    window.scrollTo({ top: 0 });
  }

  // Picking a site in the grid or on the small map shows it. Below lg that
  // means the Selected site tab.
  function pickSiteAndHour(siteId: string, hour: number) {
    selectSiteAndHour(siteId, hour);
    showTab("site");
  }

  function pickSite(siteId: string) {
    selectSite(siteId);
    showTab("site");
  }

  // Showing another month moves the selected hour into that month, on the
  // same day of the month and hour of the day.
  function changeMonth(month: number) {
    setSelectedHour(moveHourToMonth(selectedHour, month));
  }

  // Showing another year keeps the month of the year: May 2027 becomes May 2029.
  function changeYear(year: number) {
    changeMonth(firstMonthOfYear(year) + (visibleMonth % MONTHS_PER_YEAR));
  }

  // While playing, move one hour forward every PLAY_STEP_MS. Each new hour
  // starts the next wait, and the last hour of the data stops the play.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = setTimeout(() => {
      if (selectedHour >= TOTAL_HOURS - 1) {
        setIsPlaying(false);
      } else {
        setSelectedHour(selectedHour + 1);
      }
    }, PLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, selectedHour]);

  // Shows one step of the guided tour and puts the page in the state its text
  // talks about: the site, the first hour of the month, and playing or not.
  function showTourStep(index: number) {
    const step = TOUR_STEPS[index];
    setTourStepIndex(index);
    setSortKey("power");
    selectSite(step.siteId);
    setSelectedHour(firstDayOfMonth(step.month) * HOURS_PER_DAY);
    setIsPlaying(step.isPlaying);

    // Below lg the step opens the tab its target is on. The months are in the
    // header, which every tab shows, so that step stays where it is.
    if (step.target === "sites") {
      setPhoneTab("sites");
    }
    if (step.target === "selected") {
      setPhoneTab("site");
    }
    // Every target sits at the top of its tab. From lg up the page is one
    // screen tall and this moves nothing.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function closeTour() {
    setTourStepIndex(null);
    setIsPlaying(false);
  }

  // The left and right arrow keys step one hour, unless the user is typing in
  // a field (the slider handles its own arrow keys). While the guided tour is
  // open they move between its steps instead, and Escape closes it.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (tourStepIndex !== null && event.key === "Escape") {
        closeTour();
        return;
      }

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

      if (tourStepIndex !== null) {
        if (event.key === "ArrowRight" && tourStepIndex < TOUR_STEPS.length - 1) {
          event.preventDefault();
          showTourStep(tourStepIndex + 1);
        }
        if (event.key === "ArrowLeft" && tourStepIndex > 0) {
          event.preventDefault();
          showTourStep(tourStepIndex - 1);
        }
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
    // No dependency list: the handler is set up again after every redraw, so
    // it always sees the tour step on screen.
  });

  // The planner compares every site hour by hour, so opening it asks for the
  // hourly data of all of them. Time stops playing while it is open, and the
  // guided tour closes. siteList is passed in because on page load the
  // sites state is still empty.
  function openPlanner(presetId: string, siteList: Site[]) {
    setTourStepIndex(null);
    setIsPlaying(false);
    setPlannerPresetId(presetId);
    setIsPlannerOpen(true);
    for (const site of siteList) {
      requestHourly(site.id);
    }
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
        ephemerisCache.current = await fetchEphemeris();
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
      showTab("site");
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

  // The part of the page the guided tour points at, or null.
  let tourTarget: string | null = null;
  if (tourStepIndex !== null) {
    tourTarget = TOUR_STEPS[tourStepIndex].target;
  }
  const isTourOpen = tourStepIndex !== null;

  // Sort and the planner only matter next to the grid. From lg up they sit in
  // the header; below lg at the top of the Sites tab.
  const sortAndPlan = (
    <>
      <SortControl sortKey={sortKey} onChangeSort={setSortKey} />
      {/* min-h-10 makes the header buttons 40 px tall, big enough for a thumb. */}
      <button
        type="button"
        onClick={() => openPlanner(MISSION_PRESETS[0].id, sites)}
        className="min-h-10 whitespace-nowrap rounded-md bg-bright px-2.5 py-1 text-sm font-medium text-background lg:min-h-0"
      >
        Plan a mission
      </button>
    </>
  );

  return (
    // Below lg (1024 px) the page is as tall as its panels and scrolls. From lg
    // up it is exactly one screen tall.
    <div className="flex flex-col lg:h-dvh">
      {/* The header wraps onto as many lines as it needs. Only from 2xl
          (1536 px) up is the screen wide enough to hold it all on one line.
          Below lg it is two lines: the title with Tour and About, then the
          months in one row that scrolls sideways. */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-2 2xl:flex-nowrap 2xl:gap-6">
        {/* Below lg the title takes the room the buttons leave, and wraps
            onto a second line rather than push them down. */}
        <h1
          className={cn(
            "text-base font-medium text-bright max-lg:min-w-0 max-lg:flex-1 lg:text-lg",
            TOUR_FADE,
            isTourOpen && TOUR_DIM,
          )}
        >
          Lunar Landing Site Navigator
        </h1>

        <div
          inert={isTourOpen && tourTarget !== "months"}
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-lg max-lg:order-1 max-lg:w-full",
            TOUR_FADE,
            tourTarget === "months" && "ring-2 ring-bright ring-offset-4 ring-offset-background",
            isTourOpen && tourTarget !== "months" && TOUR_DIM,
          )}
        >
          <YearPicker visibleYear={yearOfMonth(visibleMonth)} onChangeYear={changeYear} />
          <MonthChips
            visibleMonth={visibleMonth}
            selectedRow={selectedRow}
            onChangeMonth={changeMonth}
          />
        </div>

        <div
          inert={isTourOpen}
          className={cn(
            "ml-auto flex shrink-0 items-center gap-2 lg:gap-4",
            TOUR_FADE,
            isTourOpen && TOUR_DIM,
          )}
        >
          <div className="contents max-lg:hidden">{sortAndPlan}</div>
          <button
            type="button"
            onClick={() => showTourStep(0)}
            className="min-h-10 whitespace-nowrap rounded-md bg-neither px-2.5 py-1 text-sm text-bright lg:min-h-0"
          >
            <span className="lg:hidden">Tour</span>
            <span className="max-lg:hidden">Take the tour</span>
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

      {/* Below lg one tab shows at a time: Sites, Selected site, or the map
          with the custom point form. The bottom padding keeps the last panel
          clear of the tab bar.
          From lg up the page is exactly one screen tall. Each column fills the
          space under the header: the Sites panel and the map take what the other
          panels leave, so the rows and the map shrink instead of the page scrolling. */}
      <main className="flex flex-col gap-3 p-3 max-lg:pb-20 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
        <div className={cn("flex flex-col gap-3 lg:min-h-0", phoneTab === "map" && "max-lg:hidden")}>
          <Panel
            title="Sites"
            caption="Each row is a place, each square a day: orange for sunlight, blue for Earth in view."
            isHighlighted={tourTarget === "sites"}
            isDimmed={isTourOpen && tourTarget !== "sites"}
            // Stacked, a tooltip near the right edge is cut off at the panel's
            // side, so it never makes the page scroll sideways.
            className={cn(
              "flex flex-col overflow-x-clip lg:min-h-0 lg:flex-1 lg:overflow-x-visible",
              phoneTab !== "sites" && "max-lg:hidden",
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 lg:hidden">{sortAndPlan}</div>
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
                  onSelect={pickSiteAndHour}
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
            isDimmed={isTourOpen && tourTarget !== "selected"}
            className={cn(phoneTab !== "site" && "max-lg:hidden")}
          >
            {/* From lg: numbers on the left, the sky and the charts on the right.
                Below lg the two columns dissolve ("contents") and the order
                classes put everything in one column: name and verdict, time
                controls, sky, the two numbers, charts, then the buttons. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[23rem_minmax(0,1fr)] lg:gap-6">
              <div className="flex flex-col gap-3 max-lg:contents">
                <SelectedSite
                  row={selectedRow}
                  hourly={selectedHourly}
                  hourlyFailed={selectedHourlyFailed}
                  selectedHour={selectedHour}
                />
                <div className="max-lg:order-4">
                  <SiteActions
                    site={selectedRow === null ? null : selectedRow.site}
                    isCustom={selectedRow !== null && selectedRow.isCustom}
                    hourly={selectedHourly}
                    selectedHour={selectedHour}
                  />
                </div>
              </div>
              {/* The time controls, then the sky at the selected hour, then
                  the month's clearance charts. */}
              <div className="flex min-w-0 flex-col gap-1 max-lg:contents">
                {selectedHourly !== null && (
                  // Below lg the page scrolls, so the controls stick to the
                  // top of the screen and stay in reach of a thumb.
                  <div className="max-lg:sticky max-lg:top-0 max-lg:z-10 max-lg:order-1 max-lg:-mx-4 max-lg:bg-panel max-lg:px-4 max-lg:py-1">
                    <TimeControls
                      visibleMonth={visibleMonth}
                      selectedHour={selectedHour}
                      isPlaying={isPlaying}
                      onTogglePlay={() => setIsPlaying((playing) => !playing)}
                      onChangeHour={setSelectedHour}
                    />
                  </div>
                )}
                <div className="min-w-0 max-lg:order-1">
                  <SkyPanorama
                    row={selectedRow}
                    hourly={selectedHourly}
                    visibleMonth={visibleMonth}
                    selectedHour={selectedHour}
                  />
                </div>
                <div className="min-w-0 max-lg:order-3">
                  <ClearanceCharts
                    row={selectedRow}
                    hourly={selectedHourly}
                    hourlyFailed={selectedHourlyFailed}
                    visibleMonth={visibleMonth}
                    selectedHour={selectedHour}
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className={cn("flex flex-col gap-3 lg:min-h-0", phoneTab !== "map" && "max-lg:hidden")}>

          <Panel
            title="South pole"
            caption="Seen from above. Earth is towards the top."
            isHighlighted={false}
            isDimmed={isTourOpen}
            className="flex flex-col lg:min-h-0 lg:flex-1"
          >
            {/* The small map is a locator: pins select, anything else opens
                the big map, where points are picked. Stacked, the grid no
                longer gives the map a height, so it is a square as wide as
                the panel, at most 480 px tall. */}
            <div className="relative aspect-square max-h-[480px] cursor-zoom-in lg:aspect-auto lg:max-h-none lg:min-h-0 lg:flex-1">
              <SouthPoleMap
                rows={mapRows}
                selectedSiteId={selectedSiteId}
                pickedPoint={pickedPoint}
                onSelectSite={pickSite}
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

          <Panel
            title="Custom point"
            caption="Try any place on the Moon."
            isHighlighted={false}
            isDimmed={isTourOpen}
          >
            <CustomSiteForm
              pickedPoint={pickedPoint}
              customCount={customSites.length}
              error={customError}
              onAdd={addCustomSite}
            />
          </Panel>
        </div>
      </main>

      {/* The tab bar, below lg only. During the guided tour it is dimmed and
          inert like the rest of the page: the tour picks the tab itself. */}
      <nav
        aria-label="Sections"
        inert={isTourOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-background lg:hidden",
          TOUR_FADE,
          isTourOpen && TOUR_DIM,
        )}
      >
        {PHONE_TABS.map((item) => {
          const isOpen = item.tab === phoneTab;
          return (
            <button
              key={item.tab}
              type="button"
              aria-pressed={isOpen}
              onClick={() => showTab(item.tab)}
              className={cn(
                "h-14 text-sm text-muted-foreground",
                // The open tab has a bright label and a bright line on top.
                isOpen && "font-medium text-bright shadow-[inset_0_2px_0_var(--bright)]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {isAboutOpen && <AboutOverlay onClose={() => setIsAboutOpen(false)} />}

      {isPlannerOpen && (
        <MissionPlanner
          rows={rows}
          hourlyBySite={hourlyBySite}
          selectedHour={selectedHour}
          onSelect={pickSiteAndHour}
          onClose={() => setIsPlannerOpen(false)}
          initialPresetId={plannerPresetId}
        />
      )}

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
