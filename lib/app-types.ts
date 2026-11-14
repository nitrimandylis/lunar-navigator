// Types and constants shared by the page and its panels.

import type { CustomHourly } from "./custom-site.ts";
import type { DaySummary, Site, SiteHourly } from "./data.ts";

// One row of the grid: a site and its per-day totals.
// A custom site is a point the user typed in. It has a flat horizon.
export type SiteRow = {
  site: Site;
  isCustom: boolean;
  days: DaySummary[];
};

// The hourly arrays of a site. A curated site has the full file from
// sites/<id>.json. A custom site only has elevations and visible flags:
// no azimuths and no terrain horizon.
export type Hourly = SiteHourly | CustomHourly;

// A point picked by clicking the map, before it is added as a custom site.
export type PickedPoint = {
  lat: number;
  lon: number;
};

export const MAX_CUSTOM_SITES = 3;

// Near pairs: two curated sites a few km apart with very different lighting.
// Each inner list holds the two site ids of one pair. The grid tags both
// sites of a pair and the map rings them with a callout.
export const NEAR_PAIRS: string[][] = [
  ["shackleton-ridge", "shackleton-shadow"],
  ["sverdrup-pair-lit", "sverdrup-pair-shadow"],
];
