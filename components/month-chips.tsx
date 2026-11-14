import type { SiteRow } from "@/lib/app-types";
import { MONTH_NAMES } from "@/lib/time";
import { cn } from "@/lib/utils";

export type MonthChipsProps = {
  // The month shown in the grid. 0 = January.
  visibleMonth: number;
  // The selected site, or null. Its monthly hours can tint the chips.
  selectedRow: SiteRow | null;
  onChangeMonth: (month: number) => void;
};

// The 12 month buttons in the header.
export function MonthChips({ visibleMonth, onChangeMonth }: MonthChipsProps) {
  return (
    <ul className="flex gap-1.5">
      {MONTH_NAMES.map((name, month) => {
        const isSelected = month === visibleMonth;
        return (
          <li key={name}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChangeMonth(month)}
              className={cn(
                "rounded-md bg-neither px-2.5 py-1 text-sm",
                // Selection is a bright ring and a bright label. Other chips are never dimmed.
                isSelected && "font-medium text-bright ring-2 ring-bright",
              )}
            >
              {name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
