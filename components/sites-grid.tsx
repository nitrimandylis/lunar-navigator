"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { NEAR_PAIRS, type Hourly, type SiteRow } from "@/lib/app-types";
import { totalsByMonth } from "@/lib/data";
import {
  dayCellLabel,
  daysOfMonth,
  formatDay,
  formatHours,
  hourStateText,
  hoursOfDay,
  laneOpacity,
  pairLabel,
  pairPartnerId,
  shortSiteName,
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
  // Sites whose hourly file failed to load.
  failedHourlyIds: string[];
  // Select a site and an hour together.
  onSelect: (siteId: string, hour: number) => void;
  // Ask for a site's hourly data. It shows up in hourlyBySite when loaded.
  onRequestHourly: (siteId: string) => void;
  onRemoveCustom: (siteId: string) => void;
};

// What the shared tooltip shows and where. left and top are pixels inside the
// grid box: the middle of the top edge of the cell being pointed at.
type Tooltip = {
  title: string;
  detail: string;
  left: number;
  top: number;
};

// From lg every row is one line of three columns: name, the day cells, the
// month totals. Below "wide" the name column is narrower and long names are
// cut short, so the days keep enough room.
// Below lg a row is two lines, so the whole month fits a phone without
// scrolling sideways: the name and the totals, then the days across the full
// width (DAYS_CELL moves them there with col-span-full and order-1).
const ROW_COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-x-3 gap-y-1 leading-tight lg:grid-cols-[15rem_minmax(0,1fr)_7.5rem] lg:gap-y-0 lg:rounded-sm lg:px-1.5 wide:grid-cols-[22rem_minmax(0,1fr)_7.5rem]";

// Where the days go: the second line below lg, the middle column from lg.
const DAYS_CELL = "max-lg:order-1 max-lg:col-span-full";

// The two month totals, Sun then Earth, in fixed columns so the numbers line up.
const TOTAL_COLUMNS = "grid grid-cols-2 gap-x-2 text-right";

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
  failedHourlyIds,
  onSelect,
  onRequestHourly,
  onRemoveCustom,
}: SitesGridProps) {
  // When a day is open, it is always the selected site's selected day. So it
  // follows the selection: another month keeps it open on the same day of the
  // month, and another site opens the same day in that site's row.
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the selected row in view. The list can scroll on a short screen, and
  // a site picked on the map or by the tour may be below the fold.
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const selectedRow = list.querySelector('[data-selected="true"]');
    if (selectedRow === null) {
      return;
    }
    // Move the list only, and only as far as it takes. scrollIntoView would
    // move the page as well: on a phone, where the page scrolls, tapping a pin
    // on the map would jump the page back up to this panel.
    const listRect = list.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    if (rowRect.top < listRect.top) {
      list.scrollTop -= listRect.top - rowRect.top;
    }
    if (rowRect.bottom > listRect.bottom) {
      list.scrollTop += rowRect.bottom - listRect.bottom;
    }
  }, [selectedSiteId]);

  // While a day is open, Escape closes it.
  useEffect(() => {
    if (!isDayOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDayOpen(false);
        setTooltip(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDayOpen]);

  const monthDays = daysOfMonth(visibleMonth);
  const selectedDay = Math.floor(selectedHour / HOURS_PER_DAY);

  // The partner of the selected site in its near pair, if it has one.
  let selectedPartnerId: string | null = null;
  if (selectedSiteId !== null) {
    selectedPartnerId = pairPartnerId(selectedSiteId, NEAR_PAIRS);
  }

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
    setIsDayOpen(true);
    onRequestHourly(siteId);
    hideTooltip();
  }

  function closeDay() {
    setIsDayOpen(false);
    hideTooltip();
  }

  // Day columns, shared by the header and every row.
  const dayColumns = { gridTemplateColumns: "repeat(" + monthDays.length + ", minmax(0, 1fr))" };
  const hourColumns = { gridTemplateColumns: "repeat(" + HOURS_PER_DAY + ", minmax(0, 1fr))" };

  return (
    <div ref={boxRef} className="relative flex min-h-0 flex-1 flex-col" onMouseLeave={hideTooltip}>
      {/* The tooltip stays outside this box, so it is never cut off. "relative"
          keeps the screen-reader-only text of the totals inside the box: without
          it that text would stick out and widen the whole page. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Header: day numbers above the day columns. Hidden from screen
            readers, because every cell's label already names its day. */}
        <div aria-hidden="true" className={cn(ROW_COLUMNS, "mb-1")}>
          <span className="text-xs text-muted-foreground">Site</span>
          <div className={cn("grid gap-px", DAYS_CELL)} style={dayColumns}>
            {monthDays.map((dayOfYear, index) => (
              <span
                key={dayOfYear}
                className={cn(
                  "text-center font-mono text-xs tabular-nums text-muted-foreground",
                  // Below 2xl a day is under 16 px wide, too narrow for every
                  // number at a readable size. Show the 1st and every 5th.
                  index !== 0 && (index + 1) % 5 !== 0 && "max-2xl:invisible",
                )}
              >
                {index + 1}
              </span>
            ))}
          </div>
          <span className={cn(TOTAL_COLUMNS, "text-xs")}>
            <span className="text-power">Sun h</span>
            <span className="text-comms">Earth h</span>
          </span>
        </div>

        {/* On a short screen the rows scroll inside the panel. The thin scrollbar
            is always drawn, so it is clear there are more rows below. */}
        <ul
          ref={listRef}
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto [scrollbar-color:var(--line)_transparent] [scrollbar-width:thin]",
          )}
        >
          {rows.map((row, rowIndex) => {
            const site = row.site;
            const isSelected = site.id === selectedSiteId;

            // The near pair tag only shows if the partner is in the grid too.
            let pairText: string | null = null;
            const partnerId = pairPartnerId(site.id, NEAR_PAIRS);
            for (const otherRow of rows) {
              if (otherRow.site.id === partnerId) {
                pairText = pairLabel(site, otherRow.site);
              }
            }
            const isPairPartner = pairText !== null && site.id === selectedPartnerId;
            const monthTotals = totalsByMonth(row.days)[visibleMonth];

            // The selected row shows 24 hourly cells while a day is open.
            const showHours = isDayOpen && isSelected;
            const hourly = hourlyBySite[site.id];
            const hourlyFailed = failedHourlyIds.includes(site.id);

            // Reference rows sit below every curated row, and custom rows below
            // those. The first row of each group carries the group's divider.
            let dividerText: string | null = null;
            const previousRow = rowIndex > 0 ? rows[rowIndex - 1] : null;
            if (row.isReference && (previousRow === null || !previousRow.isReference)) {
              dividerText = "Past landings elsewhere on the Moon: smooth horizon, no terrain";
            }
            if (row.isCustom && (previousRow === null || !previousRow.isCustom)) {
              dividerText = "Custom points: no terrain";
            }

            return (
              <Fragment key={site.id}>
                {/* The divider is a line of its own, above the first row of its group. */}
                {dividerText !== null && (
                  <li className="flex-none border-t border-line pt-1 text-xs text-muted-foreground max-lg:mt-1 lg:px-1.5">
                    {dividerText}
                  </li>
                )}
                <li
                  data-selected={isSelected}
                  className={cn(
                    ROW_COLUMNS,
                    // From lg rows share the height, and a row is never under
                    // 21 px, so the names stay easy to read. On a short screen
                    // the list scrolls instead. Below lg the page scrolls.
                    "min-h-4 max-lg:py-1 lg:max-h-[26px] lg:min-h-[21px] lg:flex-1 lg:basis-0",
                    // From lg a band behind the selected row ties it to the
                    // Verdict panel on the right.
                    isSelected && "lg:bg-line/70",
                  )}
                >
                  {/* Name, with its tags on the same line. From lg a long name is
                      cut short so the tags always fit; its title shows it in
                      full. Below lg the name wraps instead. */}
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 lg:flex-nowrap">
                    <button
                      type="button"
                      title={site.name}
                      onClick={() => onSelect(site.id, selectedHour)}
                      className={cn(
                        "block min-w-0 rounded-sm text-left text-sm leading-tight lg:truncate",
                        // A custom point is named by its numbers, which use the mono font.
                        row.isCustom && "font-mono tabular-nums",
                        isSelected && "font-medium text-bright",
                        isPairPartner && "outline-1 outline-offset-2 outline-bright outline-dashed",
                      )}
                    >
                      {shortSiteName(site.name)}
                    </button>
                    {(pairText !== null || row.isCustom || site.mission !== undefined) && (
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {site.mission !== undefined && (
                          <span className="rounded-sm bg-bright px-1.5 font-medium text-background">
                            {site.mission}
                          </span>
                        )}
                        {pairText !== null && <span className="tabular-nums">{pairText}</span>}
                        {row.isCustom && (
                          <>
                            <span className="rounded-sm border border-line px-1 leading-none py-px">no terrain</span>
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
                  {!showHours && (
                    <div className={cn("grid h-5 max-h-[22px] gap-px lg:h-full", DAYS_CELL)} style={dayColumns}>
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
                              "flex h-full max-h-[22px] flex-col gap-px rounded-xs bg-neither p-px",
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

                  {showHours && (
                    <div
                      className={cn("grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2", DAYS_CELL)}
                    >
                      <span className="font-mono text-xs tabular-nums text-bright">
                        {formatDay(selectedDay)}
                      </span>

                      {hourly === undefined && !hourlyFailed && (
                        <span className="text-xs text-muted-foreground">Loading hours.</span>
                      )}
                      {hourly === undefined && hourlyFailed && (
                        <span className="text-xs text-bright">
                          Could not load the hours. Click the site name to retry.
                        </span>
                      )}

                      {hourly !== undefined && (
                        <div className="grid h-5 max-h-[22px] gap-px lg:h-full" style={hourColumns}>
                          {hoursOfDay(selectedDay).map((hourIndex) => {
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
                                  "flex h-full max-h-[22px] flex-col gap-px rounded-xs bg-neither p-px",
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
                        aria-label={"Close " + formatDay(selectedDay)}
                        onClick={closeDay}
                        className="rounded-sm px-1.5 text-sm leading-none text-muted-foreground hover:text-bright"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Right: this month's totals, in hours. */}
                  <div className={cn(TOTAL_COLUMNS, "font-mono text-sm leading-none tabular-nums")}>
                    <span className="text-power">
                      <span className="sr-only">Sun hours this month: </span>
                      {formatHours(monthTotals.sunHours)}
                    </span>
                    <span className="text-comms">
                      <span className="sr-only">Earth hours this month: </span>
                      {formatHours(monthTotals.earthHours)}
                    </span>
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </div>

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
