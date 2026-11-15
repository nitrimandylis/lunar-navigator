import { YEARS } from "@/lib/time";

export type YearPickerProps = {
  // The calendar year on screen, for example 2028.
  visibleYear: number;
  onChangeYear: (year: number) => void;
};

// The year picker in the header: a drop-down list with one line per year
// with data. It stays the same size however many years lib/time.ts lists.
export function YearPicker({ visibleYear, onChangeYear }: YearPickerProps) {
  return (
    <select
      aria-label="Year"
      value={visibleYear}
      onChange={(event) => {
        onChangeYear(Number(event.target.value));
        // Let go of the list, so the arrow keys step the hour again instead
        // of changing the year.
        event.target.blur();
      }}
      // min-h-10 makes the picker 40 px tall on a narrow screen, big enough for a thumb.
      className="min-h-10 cursor-pointer rounded-md bg-neither px-2 py-1 font-mono text-sm font-medium tabular-nums text-bright ring-2 ring-bright lg:min-h-0"
    >
      {YEARS.map((year) => (
        // The colours are set on each line too, because some browsers draw
        // the open list with their own white background.
        <option key={year} value={year} className="bg-panel text-bright">
          {year}
        </option>
      ))}
    </select>
  );
}
