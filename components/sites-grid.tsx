"use client";

import { useEffect, useRef, useState } from "react";

import { NEAR_PAIR_IDS, type Hourly, type SiteRow } from "@/lib/app-types";
import { totalsByMonth, type Site } from "@/lib/data";
import {
  dayCellLabel,
  daysOfMonth,
  formatDay,
  formatHours,
  hourStateText,
  hoursOfDay,
  laneOpacity,
  pairLabel,
} from "@/lib/grid";
import { HOURS_PER_DAY, formatHour } from "@/lib/time";
import { cn } from "@/lib/utils";

export type SitesGridProps = {
  // Already sorted: draw them in this order.
  rows: SiteRow[];
  // The month to show. 0 = January.
  visibleMonth: number;
  selectedSiteId: string | null;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
  // Hourly data that has been loaded so far, by site id.
  hourlyBySite: Record<string, Hourly>;
  // Select a site and an hour together.
  onSelect: (siteId: string, hour: number) => void;
  // Ask for a site's hourly data. It shows up in hourlyBySite when loaded.
  onRequestHourly: (siteId: string) => void;
  onRemoveCustom: (siteId: string) => void;
};

// The day that is opened into 24 hourly cells.
type OpenDay = {
  siteId: string;
  dayOfYear: number;
};

// What the shared tooltip shows and where. left and top are pixels inside the
// grid box: the middle of the top edge of the cell being pointed at.
type Tooltip = {
  title: string;
  detail: string;
  left: number;
  top: number;
};

// The three columns of every row: name, the day cells, the month totals.
const ROW_COLUMNS = "grid grid-cols-[20rem_minmax(0,1fr)_5.5rem] items-center gap-x-3";

// The two lanes inside one cell: power on top, comms below. Each lane's
// opacity is its strength, drawn over the dark cell background.
function Lanes({ power, comms }: { power: number; comms: number }) {
  return (
    <>
      <span className="flex-1 rounded-[1px] bg-power" style={{ opacity: power }} />
      <span className="flex-1 rounded-[1px] bg-comms" style={{ opacity: comms }} />
    </>
  );
}

// The site-by-day grid. One row per site, one column per day of the month.
export function SitesGrid({
  rows,
  visibleMonth,
  selectedSiteId,
  selectedHour,
  hourlyBySite,
  onSelect,
  onRequestHourly,
  onRemoveCustom,
}: SitesGridProps) {
  const [openDay, setOpenDay] = useState<OpenDay | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // While a day is open, Escape closes it.
  useEffect(() => {
    if (openDay === null) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDay(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openDay]);

  const monthDays = daysOfMonth(visibleMonth);
  const selectedDay = Math.floor(selectedHour / HOURS_PER_DAY);

  // The near pair: find both sites. The tag only shows if both are in the grid.
  let pairSiteA: Site | null = null;
  let pairSiteB: Site | null = null;
  for (const row of rows) {
    if (row.site.id === NEAR_PAIR_IDS[0]) {
      pairSiteA = row.site;
    }
    if (row.site.id === NEAR_PAIR_IDS[1]) {
      pairSiteB = row.site;
    }
  }
  let pairText: string | null = null;
  if (pairSiteA !== null && pairSiteB !== null) {
    pairText = pairLabel(pairSiteA, pairSiteB);
  }
  const isPairSelected = selectedSiteId !== null && NEAR_PAIR_IDS.includes(selectedSiteId);

  // Moves the one shared tooltip above the cell under the pointer or focus.
  function showTooltip(cell: HTMLElement, title: string, detail: string) {
    if (boxRef.current === null) {
      return;
    }
    const boxRect = boxRef.current.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    setTooltip({
      title: title,
      detail: detail,
      left: cellRect.left + cellRect.width / 2 - boxRect.left,
      top: cellRect.top - boxRect.top,
    });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  function openDayCell(siteId: string, dayOfYear: number) {
    onSelect(siteId, dayOfYear * HOURS_PER_DAY);
    setOpenDay({ siteId: siteId, dayOfYear: dayOfYear });
    onRequestHourly(siteId);
    hideTooltip();
  }

  function closeDay() {
    setOpenDay(null);
    hideTooltip();
  }

  // Day columns, shared by the header and every row.
  const dayColumns = { gridTemplateColumns: "repeat(" + monthDays.length + ", minmax(0, 1fr))" };
  const hourColumns = { gridTemplateColumns: "repeat(" + HOURS_PER_DAY + ", minmax(0, 1fr))" };

  return (
    <div ref={boxRef} className="relative" onMouseLeave={hideTooltip}>
      {/* Header: day numbers above the day columns. */}
      <div className={cn(ROW_COLUMNS, "mb-1")}>
        <span className="text-xs text-muted-foreground">Site</span>
        <div className="grid gap-px" style={dayColumns}>
          {monthDays.map((dayOfYear, index) => (
            <span
              key={dayOfYear}
              className="text-center font-mono text-[10px] tabular-nums text-muted-foreground"
            >
              {index + 1}
            </span>
          ))}
        </div>
        <span className="text-right text-xs text-muted-foreground">Month hours</span>
      </div>

      <ul className="flex flex-col gap-1">
        {rows.map((row) => {
          const site = row.site;
          const isSelected = site.id === selectedSiteId;
          const isPairSite = pairText !== null && NEAR_PAIR_IDS.includes(site.id);
          const isPairPartner = isPairSite && isPairSelected && !isSelected;
          const monthTotals = totalsByMonth(row.days)[visibleMonth];

          // This row shows 24 hourly cells if its open day is in the month on screen.
          let isDayOpen = false;
          if (openDay !== null && openDay.siteId === site.id) {
            isDayOpen = monthDays.includes(openDay.dayOfYear);
          }

          return (
            <li key={site.id} className={cn(ROW_COLUMNS, "min-h-10")}>
              {/* Name, with its tags on a second line. */}
              <div className="min-w-0">
                <button
                  type="button"
                  title={site.name}
                  onClick={() => onSelect(site.id, selectedHour)}
                  className={cn(
                    "block max-w-full truncate rounded-sm text-left text-sm",
                    isSelected && "font-medium text-bright",
                    isPairPartner && "outline-1 outline-offset-2 outline-bright outline-dashed",
                  )}
                >
                  {site.name}
                </button>
                {(isPairSite || row.isCustom) && (
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {isPairSite && <span className="font-mono tabular-nums">{pairText}</span>}
                    {row.isCustom && (
                      <>
                        <span className="rounded-sm border border-line px-1">no terrain</span>
                        <button
                          type="button"
                          aria-label={"Remove " + site.name}
                          onClick={() => onRemoveCustom(site.id)}
                          className="rounded-sm px-1 text-sm leading-none hover:text-bright"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Middle: the days of the month, or one opened day as 24 hours. */}
              {!isDayOpen && (
                <div className="grid gap-px" style={dayColumns}>
                  {monthDays.map((dayOfYear) => {
                    const day = row.days[dayOfYear];
                    let sunHours = 0;
                    let earthHours = 0;
                    if (day !== undefined) {
                      sunHours = day.sun_hours;
                      earthHours = day.earth_hours;
                    }
                    const hasRing = isSelected && dayOfYear === selectedDay;
                    const tooltipDetail =
                      formatHours(sunHours) +
                      " h sunlight · " +
                      formatHours(earthHours) +
                      " h Earth in view";
                    return (
                      <button
                        key={dayOfYear}
                        type="button"
                        aria-label={dayCellLabel(site.name, dayOfYear, sunHours, earthHours)}
                        onClick={() => openDayCell(site.id, dayOfYear)}
                        onMouseEnter={(event) =>
                          showTooltip(event.currentTarget, formatDay(dayOfYear), tooltipDetail)
                        }
                        onFocus={(event) =>
                          showTooltip(event.currentTarget, formatDay(dayOfYear), tooltipDetail)
                        }
                        onBlur={hideTooltip}
                        className={cn(
                          "flex h-8 flex-col gap-px rounded-xs bg-neither p-px",
                          hasRing && "relative z-10 ring-2 ring-bright",
                        )}
                      >
                        <Lanes
                          power={laneOpacity(sunHours, HOURS_PER_DAY)}
                          comms={laneOpacity(earthHours, HOURS_PER_DAY)}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {isDayOpen && openDay !== null && (
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-bright">
                    {formatDay(openDay.dayOfYear)}
                  </span>

                  {hourlyBySite[site.id] === undefined && (
                    <span className="text-xs text-muted-foreground">Loading hours.</span>
                  )}

                  {hourlyBySite[site.id] !== undefined && (
                    <div className="grid gap-px" style={hourColumns}>
                      {hoursOfDay(openDay.dayOfYear).map((hourIndex) => {
                        const hourly = hourlyBySite[site.id];
                        const sunUp = hourly.sun_visible[hourIndex];
                        const earthUp = hourly.earth_visible[hourIndex];
                        const stateText = hourStateText(sunUp, earthUp);
                        const hasRing = isSelected && hourIndex === selectedHour;
                        return (
                          <button
                            key={hourIndex}
                            type="button"
                            aria-label={site.name + ", " + formatHour(hourIndex) + ": " + stateText}
                            onClick={() => onSelect(site.id, hourIndex)}
                            onMouseEnter={(event) =>
                              showTooltip(event.currentTarget, formatHour(hourIndex), stateText)
                            }
                            onFocus={(event) =>
                              showTooltip(event.currentTarget, formatHour(hourIndex), stateText)
                            }
                            onBlur={hideTooltip}
                            className={cn(
                              "flex h-8 flex-col gap-px rounded-xs bg-neither p-px",
                              hasRing && "relative z-10 ring-2 ring-bright",
                            )}
                          >
                            <Lanes power={sunUp} comms={earthUp} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    aria-label={"Close " + formatDay(openDay.dayOfYear)}
                    onClick={closeDay}
                    className="rounded-sm px-1.5 text-sm leading-none text-muted-foreground hover:text-bright"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Right: this month's totals. */}
              <div className="flex flex-col items-end font-mono text-xs tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-xs bg-power" />
                  <span className="sr-only">Power hours this month: </span>
                  {formatHours(monthTotals.sunHours)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-xs bg-comms" />
                  <span className="sr-only">Comms hours this month: </span>
                  {formatHours(monthTotals.earthHours)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* The one shared tooltip. It never catches the pointer. */}
      {tooltip !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-background px-2 py-1 font-mono text-xs whitespace-nowrap tabular-nums shadow-lg"
          style={{ left: tooltip.left, top: tooltip.top - 6 }}
        >
          <div className="text-bright">{tooltip.title}</div>
          <div className="text-muted-foreground">{tooltip.detail}</div>
        </div>
      )}
    </div>
  );
}
