import type { SortKey } from "@/lib/sort";

export type SortControlProps = {
  sortKey: SortKey;
  onChangeSort: (sortKey: SortKey) => void;
};

// Chooses how the grid rows are ordered. Placeholder: shows the current order.
export function SortControl({ sortKey }: SortControlProps) {
  return (
    <p className="text-sm text-muted-foreground">
      Sort: {sortKey === "power" ? "power hours" : "comms hours"}
    </p>
  );
}
