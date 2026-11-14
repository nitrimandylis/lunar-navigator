// Ordering of the grid rows.

import type { SiteRow } from "./app-types.ts";
import { totalsByMonth } from "./data.ts";

// "power" = most hours of sunlight first. "comms" = most hours of Earth first.
// "both" = most hours with the Sun and Earth in view at the same time.
export type SortKey = "power" | "comms" | "both";

// Returns a new array with the rows ordered by their total hours in one
// month, most hours first. Rows with the same hours are ordered by name, so
// the order never jumps around. month is 0 for January.
export function sortRows(
  rows: SiteRow[],
  sortKey: SortKey,
  month: number,
): SiteRow[] {
  // Work out each row's hours once, before sorting.
  const hoursBySiteId: Record<string, number> = {};
  for (const row of rows) {
    const monthTotals = totalsByMonth(row.days)[month];
    if (sortKey === "power") {
      hoursBySiteId[row.site.id] = monthTotals.sunHours;
    } else if (sortKey === "comms") {
      hoursBySiteId[row.site.id] = monthTotals.earthHours;
    } else {
      hoursBySiteId[row.site.id] = monthTotals.bothHours;
    }
  }

  // Copy first, because sort changes the array it is called on.
  const sorted = rows.slice();
  sorted.sort((a, b) => {
    const difference = hoursBySiteId[b.site.id] - hoursBySiteId[a.site.id];
    if (difference !== 0) {
      return difference;
    }
    return a.site.name.localeCompare(b.site.name);
  });
  return sorted;
}
