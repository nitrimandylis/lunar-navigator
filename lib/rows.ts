// Builds the grid rows from the sites and their per-day totals.

import type { SiteRow } from "./app-types.ts";
import type { DaySummary, Site } from "./data.ts";
import { sortRows, type SortKey } from "./sort.ts";

// Joins the sites with their per-day totals: one row per site.
//
// Curated rows come first, sorted by sortKey for the given month. Reference
// rows come next, in their fixed order, and custom rows last, in the order
// they were added. Neither is ever sorted in with the curated rows: they have
// a flat horizon and no terrain, so their hours cannot be compared fairly
// with sites that have real terrain.
export function buildRows(
  curatedSites: Site[],
  referenceSites: Site[],
  customSites: Site[],
  summaries: Record<string, DaySummary[]>,
  sortKey: SortKey,
  month: number,
): SiteRow[] {
  const curatedRows: SiteRow[] = [];
  for (const site of curatedSites) {
    curatedRows.push({
      site: site,
      isReference: false,
      isCustom: false,
      days: summaries[site.id] ?? [],
    });
  }

  const rows = sortRows(curatedRows, sortKey, month);
  for (const site of referenceSites) {
    rows.push({
      site: site,
      isReference: true,
      isCustom: false,
      days: summaries[site.id] ?? [],
    });
  }
  for (const site of customSites) {
    rows.push({
      site: site,
      isReference: false,
      isCustom: true,
      days: summaries[site.id] ?? [],
    });
  }
  return rows;
}
