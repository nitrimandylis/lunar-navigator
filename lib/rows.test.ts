import assert from "node:assert/strict";
import { test } from "node:test";

import type { DaySummary, Site } from "./data.ts";
import { buildRows } from "./rows.ts";

function makeSite(id: string, name: string): Site {
  return { id: id, name: name, lat: -89, lon: 0, elevation_m: 0, source: "test" };
}

// One January day with the given hours.
function oneDay(sunHours: number, earthHours: number): DaySummary[] {
  return [
    {
      date: "2027-01-01",
      sun_hours: sunHours,
      earth_hours: earthHours,
      both_hours: 0,
      max_sun_elev_deg: 1,
      longest_sun_gap_hours: 0,
    },
  ];
}

const CURATED = [makeSite("ridge", "Ridge"), makeSite("shadow", "Shadow")];
const CUSTOM = [makeSite("custom-1", "Custom 1"), makeSite("custom-2", "Custom 2")];

// The shadow numbers are the real ones from public/data/summary for 1 Jan 2027:
// the shadowed ground near Shackleton gets 0 Sun hours with real terrain. The
// custom points get a full 24, as a flat horizon near the pole can give.
const SUMMARIES: Record<string, DaySummary[]> = {
  ridge: oneDay(10, 4),
  shadow: oneDay(0, 0),
  "custom-1": oneDay(24, 2),
  "custom-2": oneDay(24, 24),
};

function ids(sites: { site: Site }[]): string[] {
  return sites.map((row) => row.site.id);
}

test("buildRows keeps custom rows below curated rows, in the order added", () => {
  const rows = buildRows(CURATED, CUSTOM, SUMMARIES, "power", 0);
  assert.deepEqual(ids(rows), ["ridge", "shadow", "custom-1", "custom-2"]);

  // Sorting by comms would put custom-2 first if it were mixed in. It is not.
  const byComms = buildRows(CURATED, CUSTOM, SUMMARIES, "comms", 0);
  assert.deepEqual(ids(byComms), ["ridge", "shadow", "custom-1", "custom-2"]);
});

test("buildRows sorts the curated rows and marks which rows are custom", () => {
  const reversed = [CURATED[1], CURATED[0]];
  const rows = buildRows(reversed, CUSTOM, SUMMARIES, "power", 0);
  assert.deepEqual(ids(rows), ["ridge", "shadow", "custom-1", "custom-2"]);
  assert.deepEqual(
    rows.map((row) => row.isCustom),
    [false, false, true, true],
  );
});

test("buildRows gives a site with no summary an empty list of days", () => {
  const rows = buildRows([makeSite("new", "New")], [], {}, "power", 0);
  assert.deepEqual(rows[0].days, []);
});
