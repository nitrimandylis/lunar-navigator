import { YEARS } from "@/lib/time";
import { cn } from "@/lib/utils";

export type YearChipsProps = {
  // The calendar year on screen, for example 2028.
  visibleYear: number;
  onChangeYear: (year: number) => void;
};

// The year buttons in the header, one per year with data. They sit before
// the month buttons and use the same selection style.
export function YearChips({ visibleYear, onChangeYear }: YearChipsProps) {
  return (
    <ul aria-label="Year" className="flex gap-1.5">
      {YEARS.map((year) => {
        const isSelected = year === visibleYear;
        return (
          <li key={year}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChangeYear(year)}
              className={cn(
                // min-h-10 makes the chip 40 px tall on a narrow screen, big enough for a thumb.
                "min-h-10 rounded-md bg-neither px-2 py-1 font-mono text-sm tabular-nums lg:min-h-0",
                isSelected && "font-medium text-bright ring-2 ring-bright",
              )}
            >
              {year}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
