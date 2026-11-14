// Builds the grid rows from the sites and their per-day totals.

import type { SiteRow } from "./app-types.ts";
import type { DaySummary, Site } from "./data.ts";
import { sortRows, type SortKey } from "./sort.ts";

// Joins the sites with their per-day totals: one row per site.
//
// Curated rows come first, sorted by sortKey for the given month. Custom rows
// come after them, in the order they were added, and are never sorted in with
// the curated rows: a custom point has a flat horizon and no terrain, so its
// hours can be far too high near the pole.
export function buildRows(
  curatedSites: Site[],
  customSites: Site[],
  summaries: Record<string, DaySummary[]>,
  sortKey: SortKey,
  month: number,
): SiteRow[] {
  const curatedRows: SiteRow[] = [];
  for (const site of curatedSites) {
    curatedRows.push({ site: site, isCustom: false, days: summaries[site.id] ?? [] });
  }

  const rows = sortRows(curatedRows, sortKey, month);
  for (const site of customSites) {
    rows.push({ site: site, isCustom: true, days: summaries[site.id] ?? [] });
  }
  return rows;
}
