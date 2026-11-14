import assert from "node:assert/strict";
import { test } from "node:test";

import type { SiteRow } from "./app-types.ts";
import { sortRows } from "./sort.ts";

// A row with one day in January and one day in February.
function makeRow(
  id: string,
  name: string,
  januarySun: number,
  januaryEarth: number,
  februarySun: number,
): SiteRow {
  return {
    site: { id: id, name: name, lat: -89, lon: 0, elevation_m: 0, source: "test" },
    isCustom: false,
    days: [
      {
        date: "2027-01-01",
        sun_hours: januarySun,
        earth_hours: januaryEarth,
        max_sun_elev_deg: 1,
        longest_sun_gap_hours: 0,
      },
      {
        date: "2027-02-01",
        sun_hours: februarySun,
        earth_hours: 0,
        max_sun_elev_deg: 1,
        longest_sun_gap_hours: 0,
      },
    ],
  };
}

function ids(rows: SiteRow[]): string[] {
  return rows.map((row) => row.site.id);
}

const ROWS = [
  makeRow("a", "Alpha", 5, 20, 24),
  makeRow("b", "Bravo", 20, 5, 0),
  makeRow("c", "Charlie", 10, 10, 12),
];

test("sortRows puts the most sunlight first for power", () => {
  assert.deepEqual(ids(sortRows(ROWS, "power", 0)), ["b", "c", "a"]);
});

test("sortRows puts the most Earth hours first for comms", () => {
  assert.deepEqual(ids(sortRows(ROWS, "comms", 0)), ["a", "c", "b"]);
});

test("sortRows uses the month it is given", () => {
  // In February the order by sunlight is different from January.
  assert.deepEqual(ids(sortRows(ROWS, "power", 1)), ["a", "c", "b"]);
});

test("sortRows orders equal rows by name and leaves the input alone", () => {
  const tied = [makeRow("z", "Zulu", 8, 0, 0), makeRow("m", "Mike", 8, 0, 0)];
  assert.deepEqual(ids(sortRows(tied, "power", 0)), ["m", "z"]);
  // The array passed in keeps its order.
  assert.deepEqual(ids(tied), ["z", "m"]);
});
