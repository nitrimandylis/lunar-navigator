"use client";

import { useEffect, useRef, useState } from "react";

import type { Hourly, SiteRow } from "@/lib/app-types";
import { formatDay, shortSiteName } from "@/lib/grid";
import {
  FIRST_YEAR,
  HOURS_PER_DAY,
  LAST_YEAR,
  TOTAL_DAYS,
  YEARS,
  firstDayOfMonth,
  firstMonthOfYear,
  formatHour,
} from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  MISSION_PRESETS,
  countGoodDays,
  dayRuns,
  landingDays,
  landingHours,
  nextLandingHour,
  slipMargin,
  type MissionNeeds,
} from "@/lib/windows";

export type MissionPlannerProps = {
  // Every row of the grid: curated sites, past landings and custom points.
  rows: SiteRow[];
  // Hourly data by site id. A site that is still loading is missing.
  hourlyBySite: Record<string, Hourly>;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
  // Shows a site at an hour on the main page.
  onSelect: (siteId: string, hour: number) => void;
  onClose: () => void;
  // The mission preset the panel opens on, for example "rover".
  initialPresetId: string;
};

// One site's answer for the mission on screen.
type SiteResult = {
  row: SiteRow;
  // False while the site's hourly data is still loading.
  isLoaded: boolean;
  // 1 or 0 per hour of the data: can a mission land at that hour?
  works: number[];
  // 1 or 0 per day of the data: does the day have a landing hour that works?
  days: number[];
  goodDays: number;
};

// "2027 to 2030", for the texts below.
const YEARS_TEXT = FIRST_YEAR + " to " + LAST_YEAR;

// The day index on which a year starts. 2028 gives 365.
function firstDayOfYear(year: number): number {
  return firstDayOfMonth(firstMonthOfYear(year));
}

// The four number boxes. The planner keeps days and percentages, which are
// easier to type than hours and shares, and turns them into MissionNeeds.
type NeedsForm = {
  stayDays: number;
  sunPercent: number;
  earthPercent: number;
  darkHours: number;
};

function formFromNeeds(needs: MissionNeeds): NeedsForm {
  return {
    stayDays: needs.lengthHours / HOURS_PER_DAY,
    sunPercent: Math.round(needs.minSunShare * 100),
    earthPercent: Math.round(needs.minEarthShare * 100),
    darkHours: needs.maxDarkHours,
  };
}

function needsFromForm(form: NeedsForm): MissionNeeds {
  return {
    lengthHours: form.stayDays * HOURS_PER_DAY,
    minSunShare: form.sunPercent / 100,
    minEarthShare: form.earthPercent / 100,
    maxDarkHours: form.darkHours,
  };
}

// Works out one site's landing hours and days for a mission.
function resultForRow(
  row: SiteRow,
  hourly: Hourly | undefined,
  needs: MissionNeeds,
): SiteResult {
  if (hourly === undefined) {
    return { row: row, isLoaded: false, works: [], days: [], goodDays: 0 };
  }
  const works = landingHours(hourly.sun_visible, hourly.earth_visible, needs);
  const days = landingDays(works);
  return {
    row: row,
    isLoaded: true,
    works: works,
    days: days,
    goodDays: countGoodDays(days),
  };
}

// A number box with a label above it and its unit after it.
function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            // Ignore an empty box or anything that is not a whole number, and
            // keep the value inside its limits.
            const typed = Number(event.target.value);
            if (event.target.value === "" || !Number.isInteger(typed)) {
              return;
            }
            onChange(Math.min(max, Math.max(min, typed)));
          }}
          className="w-20 rounded-md border border-line bg-background px-2 py-1 font-mono text-sm tabular-nums text-bright"
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

// Every day of the four years as one thin strip: a bright bar on every day
// with a landing hour that works. Clicking the strip shows that day on the main page.
function YearStrip({
  result,
  selectedDay,
  onPickDay,
}: {
  result: SiteResult;
  selectedDay: number;
  onPickDay: (day: number) => void;
}) {
  return (
    <svg
      viewBox={"0 0 " + TOTAL_DAYS + " 10"}
      preserveAspectRatio="none"
      className="h-4 w-full cursor-pointer rounded-sm"
      aria-hidden="true"
      onClick={(event) => {
        // How far across the strip the click was, as a day index.
        const box = event.currentTarget.getBoundingClientRect();
        const share = (event.clientX - box.left) / box.width;
        const day = Math.floor(share * TOTAL_DAYS);
        onPickDay(Math.min(TOTAL_DAYS - 1, Math.max(0, day)));
      }}
    >
      <rect x={0} y={0} width={TOTAL_DAYS} height={10} className="fill-neither" />
      {dayRuns(result.days).map((run) => (
        <rect
          key={run.startDay}
          x={run.startDay}
          y={0}
          width={run.dayCount}
          height={10}
          className="fill-bright"
        />
      ))}
      {/* A thin line where each year starts, and an orange one on the day
          selected on the main page. */}
      {YEARS.map((year) => (
        <rect
          key={year}
          x={firstDayOfYear(year)}
          y={0}
          width={2}
          height={10}
          className="fill-background"
        />
      ))}
      <rect x={selectedDay} y={0} width={5} height={10} className="fill-power" />
    </svg>
  );
}

// A full-screen panel that answers "where and when can this mission land?"
// for every site at once. The user picks a kind of mission, and the panel
// ranks the sites by how many days from 2027 to 2030 have a landing time
// that works.
export function MissionPlanner({
  rows,
  hourlyBySite,
  selectedHour,
  onSelect,
  onClose,
  initialPresetId,
}: MissionPlannerProps) {
  // Start on the preset asked for, or the first one if the id is not known.
  let initialPreset = MISSION_PRESETS[0];
  for (const preset of MISSION_PRESETS) {
    if (preset.id === initialPresetId) {
      initialPreset = preset;
    }
  }
  const [presetId, setPresetId] = useState<string | null>(initialPreset.id);
  const [form, setForm] = useState<NeedsForm>(formFromNeeds(initialPreset.needs));

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // The latest onClose, so the Escape listener below is set up only once.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes the panel. Focus starts on the close button.
  useEffect(() => {
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Changing a number box means the needs no longer match a preset.
  function changeForm(change: Partial<NeedsForm>) {
    setForm({ ...form, ...change });
    setPresetId(null);
  }

  const needs = needsFromForm(form);
  const selectedDay = Math.floor(selectedHour / HOURS_PER_DAY);

  // Sites with real terrain are ranked. Past landings and custom points have
  // a flat horizon, so they are listed apart and never ranked (as in the grid).
  const terrainResults: SiteResult[] = [];
  const flatResults: SiteResult[] = [];
  for (const row of rows) {
    const result = resultForRow(row, hourlyBySite[row.site.id], needs);
    if (row.isReference || row.isCustom) {
      flatResults.push(result);
    } else {
      terrainResults.push(result);
    }
  }

  // Most landing days first. Sites with the same count are ordered by name.
  terrainResults.sort((a, b) => {
    if (b.goodDays !== a.goodDays) {
      return b.goodDays - a.goodDays;
    }
    return a.row.site.name.localeCompare(b.row.site.name);
  });

  let loadedCount = 0;
  let workingCount = 0;
  for (const result of terrainResults) {
    if (result.isLoaded) {
      loadedCount += 1;
    }
    if (result.goodDays > 0) {
      workingCount += 1;
    }
  }
  const isAllLoaded = loadedCount === terrainResults.length;

  // The hour to show when a site is picked: its next landing from the
  // selected hour, or its first of all, or the selected hour if it has none.
  function hourToShow(result: SiteResult): number {
    const next = nextLandingHour(result.works, selectedHour);
    if (next !== null) {
      return next;
    }
    const first = nextLandingHour(result.works, 0);
    if (first !== null) {
      return first;
    }
    return selectedHour;
  }

  function pickSite(result: SiteResult) {
    onSelect(result.row.site.id, hourToShow(result));
    onClose();
  }

  // Clicking a day on a strip shows that day's first landing hour, or the
  // start of the day when it has none (to see why it fails).
  function pickDay(result: SiteResult, day: number) {
    const dayStart = day * HOURS_PER_DAY;
    let hour = dayStart;
    const next = nextLandingHour(result.works, dayStart);
    if (next !== null && next < dayStart + HOURS_PER_DAY) {
      hour = next;
    }
    onSelect(result.row.site.id, hour);
    onClose();
  }

  // The sentence above the table: the answer in words.
  let headline = "Loading the hourly data: " + loadedCount + " of " + terrainResults.length + " sites.";
  if (isAllLoaded && workingCount === 0) {
    headline =
      "No site can host this mission from " +
      YEARS_TEXT +
      ". Relax a need below to see what is closest.";
  }
  if (isAllLoaded && workingCount > 0) {
    const best = terrainResults[0];
    headline =
      workingCount +
      " of " +
      terrainResults.length +
      " sites can host this mission from " +
      YEARS_TEXT +
      ". Best: " +
      shortSiteName(best.row.site.name) +
      ", with a landing time that works on " +
      best.goodDays +
      " of " +
      TOTAL_DAYS +
      " days.";
  }

  // One row of the table. rank is null for the sites that are not ranked.
  function renderRow(result: SiteResult, rank: number | null) {
    const site = result.row.site;
    const next = nextLandingHour(result.works, selectedHour);

    let nextText = "none after the selected hour";
    if (!result.isLoaded) {
      nextText = "loading";
    } else if (result.goodDays === 0) {
      nextText = "never, " + YEARS_TEXT;
    } else if (next !== null) {
      nextText = formatHour(next);
    }

    // How far a landing on the selected day can slip and stay in its window.
    let slipText = "";
    if (result.isLoaded && result.goodDays === 0) {
      slipText = "never";
    } else if (result.isLoaded) {
      const margin = slipMargin(dayRuns(result.days), selectedDay);
      if (margin.slipDays !== null) {
        slipText = margin.slipDays + " d";
      } else if (margin.nextGoodDay !== null) {
        // A line break, so the date never splits over two lines.
        slipText = "next window\n" + formatDay(margin.nextGoodDay);
      } else {
        slipText = "none";
      }
    }

    return (
      <li
        key={site.id}
        className={cn(
          "grid grid-cols-[1.5rem_17rem_minmax(14rem,1fr)_3.5rem_13rem_6.5rem] items-center gap-x-3 py-1",
          result.isLoaded && result.goodDays === 0 && "opacity-50",
        )}
      >
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {rank !== null ? rank : ""}
        </span>
        <button
          type="button"
          onClick={() => pickSite(result)}
          title={"Show " + shortSiteName(site.name) + " at its next landing time"}
          // The name is cut short when it does not fit. The mission tag never is.
          className="flex min-h-10 min-w-0 items-center gap-2 text-left text-bright underline-offset-2 hover:underline lg:min-h-0"
        >
          <span className="truncate">{shortSiteName(site.name)}</span>
          {site.mission !== undefined && (
            <span className="shrink-0 rounded-sm bg-bright px-1.5 text-xs font-medium text-background">
              {site.mission}
            </span>
          )}
        </button>
        <div title="Click a day to show it on the main page">
          <YearStrip
            result={result}
            selectedDay={selectedDay}
            onPickDay={(day) => pickDay(result, day)}
          />
        </div>
        <span className="text-right font-mono tabular-nums text-bright">
          {result.isLoaded ? result.goodDays : ""}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{nextText}</span>
        <span
          className={cn(
            "whitespace-pre-line font-mono text-xs tabular-nums",
            slipText === "never" ? "text-muted-foreground" : "text-bright",
          )}
        >
          {slipText}
        </span>
      </li>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mission planner"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col rounded-lg border border-line bg-panel">
        <header className="flex items-center gap-4 border-b border-line px-5 py-3">
          <h2 className="font-medium text-bright">Mission planner</h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Where and when can this mission land? Every site, every day from {YEARS_TEXT}.
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto rounded-md bg-neither px-2.5 py-1 text-bright"
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4 text-sm text-foreground">
          {/* 1. The kind of mission. */}
          <div role="group" aria-label="Mission" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MISSION_PRESETS.map((preset) => {
              const isSelected = preset.id === presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setPresetId(preset.id);
                    setForm(formFromNeeds(preset.needs));
                  }}
                  className={cn(
                    "rounded-md bg-neither px-3 py-2 text-left",
                    isSelected && "ring-2 ring-bright",
                  )}
                >
                  <span className="block font-medium text-bright">{preset.name}</span>
                  <span className="block text-xs text-muted-foreground">{preset.note}</span>
                </button>
              );
            })}
          </div>

          {/* 2. What it needs. Every number can be changed. */}
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
            <NumberField
              label="Stay on the surface"
              unit="days"
              value={form.stayDays}
              min={1}
              max={300}
              onChange={(value) => changeForm({ stayDays: value })}
            />
            <NumberField
              label="Sun in view at least"
              unit="% of the stay"
              value={form.sunPercent}
              min={0}
              max={100}
              onChange={(value) => changeForm({ sunPercent: value })}
            />
            <NumberField
              label="Earth in view at least"
              unit="% of the stay"
              value={form.earthPercent}
              min={0}
              max={100}
              onChange={(value) => changeForm({ earthPercent: value })}
            />
            <NumberField
              label="Longest dark spell"
              unit="hours"
              value={form.darkHours}
              min={0}
              max={1000}
              onChange={(value) => changeForm({ darkHours: value })}
            />
          </div>

          {/* 3. The answer in words, then site by site. */}
          <p aria-live="polite" className="text-base text-bright">
            {headline}
          </p>

          {/* On a narrow screen the table scrolls sideways inside the panel.
              shrink-0 keeps it at its full height, so only the panel scrolls
              up and down. */}
          <div className="shrink-0 overflow-x-auto">
            <div className="min-w-[60rem]">
              <div className="grid grid-cols-[1.5rem_17rem_minmax(14rem,1fr)_3.5rem_13rem_6.5rem] items-end gap-x-3 pb-1 text-xs text-muted-foreground">
                <span />
                <span>Site</span>
                {/* The years sit over the strips, each where its year starts. */}
                <span className="relative block h-4 font-mono tabular-nums">
                  {YEARS.map((year) => (
                    <span
                      key={year}
                      className="absolute"
                      style={{ left: (firstDayOfYear(year) / TOTAL_DAYS) * 100 + "%" }}
                    >
                      {year}
                    </span>
                  ))}
                </span>
                <span className="text-right">Days</span>
                <span>Next landing</span>
                <span>Slip margin</span>
              </div>

              <ol>{terrainResults.map((result, index) => renderRow(result, index + 1))}</ol>

              {flatResults.length > 0 && (
                <>
                  <p className="mt-2 border-t border-line pt-2 text-xs text-muted-foreground">
                    Smooth Moon, no terrain: past landings and custom points. Not ranked.
                  </p>
                  <ul>{flatResults.map((result) => renderRow(result, null))}</ul>
                </>
              )}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            A bright bar is a day with at least one landing hour that works: the Sun is up
            at touchdown, and the whole stay meets the needs above. The orange line is the
            day selected on the main page ({formatDay(selectedDay)}). A stay has to end
            before the data does, so long stays show nothing late in {LAST_YEAR}. The mission lengths
            come from real missions. The percentages are our own starting points, not
            agency requirements: change them to fit your mission. Slip margin: how many
            days the launch can slip from the picked day and still land in the same window.
          </p>
        </div>
      </div>
    </div>
  );
}
