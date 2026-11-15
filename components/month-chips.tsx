import type { SiteRow } from "@/lib/app-types";
import { totalsByMonth } from "@/lib/data";
import { monthLaneStrengths } from "@/lib/grid";
import { MONTH_NAMES } from "@/lib/time";
import { cn } from "@/lib/utils";

export type MonthChipsProps = {
  // The month shown in the grid. 0 = January.
  visibleMonth: number;
  // The selected site, or null. Its monthly hours can tint the chips.
  selectedRow: SiteRow | null;
  onChangeMonth: (month: number) => void;
};

// The 12 month buttons in the header. Each chip has two thin lanes under its
// label: orange for the selected site's sunlight that month, blue for Earth.
export function MonthChips({ visibleMonth, selectedRow, onChangeMonth }: MonthChipsProps) {
  // With no site selected every lane stays empty.
  let monthTotals = null;
  if (selectedRow !== null) {
    monthTotals = totalsByMonth(selectedRow.days);
  }

  return (
    // On a narrow screen the 12 chips wrap onto more lines.
    <ul className="flex flex-wrap gap-1.5 lg:flex-nowrap">
      {MONTH_NAMES.map((name, month) => {
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
          <li key={name}>
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
