import type { SortKey } from "@/lib/sort";
import { cn } from "@/lib/utils";

export type SortControlProps = {
  sortKey: SortKey;
  onChangeSort: (sortKey: SortKey) => void;
};

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "power", label: "Power" },
  { key: "comms", label: "Comms" },
  { key: "both", label: "Both" },
];

// Chooses how the grid rows are ordered: most sunlight, most Earth hours, or
// most hours with both in view first.
export function SortControl({ sortKey, onChangeSort }: SortControlProps) {
  return (
    <div role="group" aria-label="Sort" className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort</span>
      {OPTIONS.map((option) => {
        const isSelected = option.key === sortKey;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChangeSort(option.key)}
            className={cn(
              // min-h-10 makes the button 40 px tall on a narrow screen, big enough for a thumb.
              // From lg the buttons sit on a panel's title line, so they are shorter.
              "min-h-10 rounded-md bg-neither px-2.5 py-1 text-sm lg:min-h-0 lg:py-0.5",
              // Same selection style as the month chips: bright ring and label.
              isSelected && "font-medium text-bright ring-2 ring-bright",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
