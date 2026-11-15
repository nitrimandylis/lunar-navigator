import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { SiteHourly } from "./data.ts";
import { hourlyCsv, parseShareQuery, shareQuery } from "./share.ts";
import { hourToIso, isoToHour } from "./time.ts";

const KNOWN_IDS = ["shackleton-ridge", "ref-apollo-11"];

test("hourToIso and isoToHour agree on the real 2027 calendar", () => {
  assert.equal(hourToIso(0), "2027-01-01T00:00Z");
  // 1 March is day 59 of a year that is not a leap year (31 + 28).
  assert.equal(hourToIso(59 * 24 + 5), "2027-03-01T05:00Z");
  assert.equal(hourToIso(8759), "2027-12-31T23:00Z");

  assert.equal(isoToHour("2027-01-01T00:00Z"), 0);
  assert.equal(isoToHour("2027-03-01T05:00Z"), 59 * 24 + 5);
  assert.equal(isoToHour("2027-12-31T23:00Z"), 8759);
});

test("isoToHour reads the later years too", () => {
  // 2028 starts 365 days after 2027. Its 29 February exists.
  assert.equal(isoToHour("2028-01-01T00:00Z"), 365 * 24);
  assert.equal(isoToHour("2028-02-29T07:00Z"), (365 + 31 + 28) * 24 + 7);
  assert.equal(hourToIso((365 + 31 + 28) * 24 + 7), "2028-02-29T07:00Z");
  assert.equal(isoToHour("2040-12-31T23:00Z"), 5114 * 24 - 1);
});

test("isoToHour rejects anything that is not a whole hour inside the data", () => {
  assert.equal(isoToHour("2026-12-31T23:00Z"), null);
  assert.equal(isoToHour("2041-01-01T00:00Z"), null);
  // 2027 is not a leap year, so it has no 29 February.
  assert.equal(isoToHour("2027-02-29T00:00Z"), null);
  assert.equal(isoToHour("2027-03-01T05:30Z"), null);
  assert.equal(isoToHour("2027-13-01T05:00Z"), null);
  assert.equal(isoToHour("2027-03-01"), null);
  assert.equal(isoToHour("yesterday"), null);
});

test("a share link gives back the site and hour it was made from", () => {
  const query = shareQuery("shackleton-ridge", 3240);
  assert.equal(query, "?site=shackleton-ridge&time=2027-05-16T00:00Z");
  assert.deepEqual(parseShareQuery(query, KNOWN_IDS), {
    siteId: "shackleton-ridge",
    hour: 3240,
    planPresetId: null,
    startsTour: false,
  });
});

test("parseShareQuery ignores what it does not know", () => {
  assert.deepEqual(parseShareQuery("", KNOWN_IDS), {
    siteId: null,
    hour: null,
    planPresetId: null,
    startsTour: false,
  });
  assert.deepEqual(parseShareQuery("?site=nowhere&time=soon", KNOWN_IDS), {
    siteId: null,
    hour: null,
    planPresetId: null,
    startsTour: false,
  });
  // One good part is kept even when the other is bad.
  assert.deepEqual(parseShareQuery("?site=ref-apollo-11&time=soon", KNOWN_IDS), {
    siteId: "ref-apollo-11",
    hour: null,
    planPresetId: null,
    startsTour: false,
  });
});

test("the plan part names a mission preset to open the planner on", () => {
  assert.equal(parseShareQuery("", KNOWN_IDS).planPresetId, null);
  assert.equal(parseShareQuery("?plan=rover", KNOWN_IDS).planPresetId, "rover");
  assert.equal(parseShareQuery("?plan=crew", KNOWN_IDS).planPresetId, "crew");
  // "1" or a name that is not a preset opens the first preset, Short lander.
  assert.equal(parseShareQuery("?plan=1", KNOWN_IDS).planPresetId, "lander");
  assert.equal(parseShareQuery("?plan=bogus", KNOWN_IDS).planPresetId, "lander");
});

test("the plan part works together with a site and a time", () => {
  assert.deepEqual(
    parseShareQuery("?plan=crew&site=shackleton-ridge&time=2027-05-16T00:00Z", KNOWN_IDS),
    { siteId: "shackleton-ridge", hour: 3240, planPresetId: "crew", startsTour: false },
  );
});

test("the tour part starts the guided tour", () => {
  assert.equal(parseShareQuery("", KNOWN_IDS).startsTour, false);
  assert.equal(parseShareQuery("?site=shackleton-ridge", KNOWN_IDS).startsTour, false);
  assert.equal(parseShareQuery("?tour=1", KNOWN_IDS).startsTour, true);
});

test("hourlyCsv writes a header and one line per hour", () => {
  const csv = hourlyCsv({
    sun_elev_deg: [1.5, -0.25],
    sun_az_deg: [10, 11],
    earth_elev_deg: [3, 3.5],
    earth_az_deg: [200, 201],
    sun_visible: [1, 0],
    earth_visible: [1, 1],
  });
  assert.equal(
    csv,
    "time_utc,sun_elev_deg,sun_az_deg,earth_elev_deg,earth_az_deg,sun_visible,earth_visible\n" +
      "2027-01-01T00:00Z,1.5,10,3,200,1,1\n" +
      "2027-01-01T01:00Z,-0.25,11,3.5,201,0,1\n",
  );
});

// Known answer: the CSV of a real site file has the year's 8760 hours, and
// its first line holds the file's own first values (from JPL Horizons).
test("the CSV of a real site covers every hour of 2027", () => {
  const hourly = JSON.parse(
    readFileSync("public/data/sites/shackleton-ridge.json", "utf8"),
  ) as SiteHourly;
  const lines = hourlyCsv(hourly).trimEnd().split("\n");

  assert.equal(lines.length, 8761);
  assert.equal(
    lines[1],
    "2027-01-01T00:00Z," +
      hourly.sun_elev_deg[0] +
      "," +
      hourly.sun_az_deg[0] +
      "," +
      hourly.earth_elev_deg[0] +
      "," +
      hourly.earth_az_deg[0] +
      "," +
      hourly.sun_visible[0] +
      "," +
      hourly.earth_visible[0],
  );
  assert.equal(lines[8760].split(",")[0], "2027-12-31T23:00Z");
});
