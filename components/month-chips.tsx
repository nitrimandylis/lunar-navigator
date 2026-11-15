"use client";

import { useEffect, useRef } from "react";

import type { SiteRow } from "@/lib/app-types";
import { totalsByMonth } from "@/lib/data";
import { monthLaneStrengths } from "@/lib/grid";
import { MONTHS_PER_YEAR, firstMonthOfYear, monthName, yearOfMonth } from "@/lib/time";
import { cn } from "@/lib/utils";

export type MonthChipsProps = {
  // The month shown in the grid. 0 = January 2027 (see lib/time.ts).
  visibleMonth: number;
  // The selected site, or null. Its monthly hours can tint the chips.
  selectedRow: SiteRow | null;
  onChangeMonth: (month: number) => void;
};

// The 12 month buttons in the header, for the year of the month on screen. Each chip has two thin lanes under its
// label: orange for the selected site's sunlight that month, blue for Earth.
export function MonthChips({ visibleMonth, selectedRow, onChangeMonth }: MonthChipsProps) {
  // Below lg the chips are one row that scrolls sideways. Keep the selected
  // month in the middle of it. Only the row moves: scrollIntoView would also
  // scroll the page, which jumps while time is playing.
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const chip = list.children[visibleMonth % MONTHS_PER_YEAR] as HTMLElement | undefined;
    if (chip === undefined) {
      return;
    }
    list.scrollLeft = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2;
  }, [visibleMonth]);

  // With no site selected every lane stays empty.
  let monthTotals = null;
  if (selectedRow !== null) {
    monthTotals = totalsByMonth(selectedRow.days);
  }

  // The month indexes of the 12 months of the year on screen.
  const firstMonth = firstMonthOfYear(yearOfMonth(visibleMonth));
  const months: number[] = [];
  for (let i = 0; i < MONTHS_PER_YEAR; i++) {
    months.push(firstMonth + i);
  }

  return (
    // Below lg the 12 chips sit in one row that scrolls sideways. "relative"
    // makes each chip's offsetLeft count from the row. The padding keeps the
    // selected chip's ring inside the row, which would otherwise clip it.
    <ul
      ref={listRef}
      className="relative flex min-w-0 gap-1.5 overflow-x-auto p-1 [scrollbar-width:none] lg:overflow-visible lg:p-0"
    >
      {months.map((month) => {
        const name = monthName(month);
        const isSelected = month === visibleMonth;

        let powerOpacity = 0;
        let commsOpacity = 0;
        if (monthTotals !== null) {
          const strengths = monthLaneStrengths(
            month,
            monthTotals[month].sunHours,
            monthTotals[month].earthHours,
          );
          powerOpacity = strengths.power;
          commsOpacity = strengths.comms;
        }

        return (
          <li key={month} className="shrink-0">
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChangeMonth(month)}
              className={cn(
                // min-h-10 makes the chip 40 px tall on a narrow screen, big enough for a thumb.
                "flex min-h-10 flex-col items-stretch justify-center gap-1 rounded-md bg-neither px-2.5 pt-1 pb-1.5 text-sm lg:min-h-0 lg:justify-start",
                // Selection is a bright ring and a bright label. Other chips are never dimmed.
                isSelected && "font-medium text-bright ring-2 ring-bright",
              )}
            >
              <span>{name}</span>
              {/* The tint sits under the label, so the label stays readable. */}
              <span aria-hidden="true" className="flex flex-col gap-px">
                <span className="h-0.5 rounded-full bg-power" style={{ opacity: powerOpacity }} />
                <span className="h-0.5 rounded-full bg-comms" style={{ opacity: commsOpacity }} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
