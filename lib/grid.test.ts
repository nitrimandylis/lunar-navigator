import assert from "node:assert/strict";
import { test } from "node:test";

import type { Site } from "./data.ts";
import {
  dayCellLabel,
  daysOfMonth,
  formatDay,
  formatHours,
  hourStateText,
  hoursOfDay,
  laneOpacity,
  monthLaneStrengths,
  pairLabel,
  pairPartnerId,
  shortSiteName,
} from "./grid.ts";

test("laneOpacity is 0 for no hours and rises from the floor to 1", () => {
  assert.equal(laneOpacity(0, 24), 0);
  assert.equal(laneOpacity(-1, 24), 0);
  assert.equal(laneOpacity(5, 0), 0);
  // 12 of 24 hours: halfway from 0.3 to 1.
  assert.ok(Math.abs(laneOpacity(12, 24) - 0.65) < 1e-9);
  assert.equal(laneOpacity(24, 24), 1);
  assert.equal(laneOpacity(30, 24), 1);
  // One hour is already clearly visible.
  assert.ok(laneOpacity(1, 24) > 0.3);
});

test("shortSiteName drops only a trailing (computed)", () => {
  assert.equal(shortSiteName("Candidate near Haworth (computed)"), "Candidate near Haworth");
  assert.equal(shortSiteName("IM-2 landing site"), "IM-2 landing site");
  assert.equal(shortSiteName("(computed) first"), "(computed) first");
});

test("daysOfMonth lists the day-of-year numbers of a month", () => {
  const january = daysOfMonth(0);
  assert.equal(january.length, 31);
  assert.equal(january[0], 0);
  assert.equal(january[30], 30);

  // 2027 is not a leap year: February runs from day 31 to day 58.
  const february = daysOfMonth(1);
  assert.equal(february.length, 28);
  assert.equal(february[0], 31);
  assert.equal(february[27], 58);

  const december = daysOfMonth(11);
  assert.equal(december[30], 364);
});

test("hoursOfDay lists the 24 hour indexes of a day", () => {
  const hours = hoursOfDay(2);
  assert.equal(hours.length, 24);
  assert.equal(hours[0], 48);
  assert.equal(hours[23], 71);
});

test("formatDay and formatHours give short text", () => {
  // 14 March is day 72 (31 + 28 + 13).
  assert.equal(formatDay(72), "14 Mar 2027");
  assert.equal(formatDay(0), "1 Jan 2027");
  assert.equal(formatHours(18), "18");
  assert.equal(formatHours(2.5), "2.5");
  assert.equal(formatHours(2.04), "2");
});

test("dayCellLabel reads a real day in words", () => {
  // From public/data/summary/shackleton-ridge.json, 2027-01-03:
  // sun_hours 11.0, earth_hours 0.0.
  assert.equal(
    dayCellLabel("Lit ridge near Shackleton (computed)", 2, 11, 0),
    "Lit ridge near Shackleton (computed), 3 Jan 2027: 11 hours of sunlight, 0 hours with Earth in view",
  );
});

test("hourStateText says whether the Sun and Earth are up", () => {
  assert.equal(hourStateText(1, 0), "Sun up, Earth out of view");
  assert.equal(hourStateText(0, 1), "Sun down, Earth in view");
});

test("pairLabel gives the real Shackleton pair about 3.5 km apart", () => {
  // From public/data/sites.json. Its source text says the pair is
  // "about 3500 m apart".
  const ridge: Site = {
    id: "shackleton-ridge",
    name: "Lit ridge near Shackleton (computed)",
    lat: -89.3277,
    lon: 116.8355,
    elevation_m: 1200,
    source: "test",
  };
  const shadow: Site = {
    id: "shackleton-shadow",
    name: "Shadowed ground near Shackleton (computed)",
    lat: -89.4283,
    lon: 122.0651,
    elevation_m: -638,
    source: "test",
  };
  assert.equal(pairLabel(ridge, shadow), "pair · 3.5 km");
  assert.equal(pairLabel(shadow, ridge), "pair · 3.5 km");
});

test("pairLabel gives the real Sverdrup pair about 2.5 km apart", () => {
  // From public/data/sites.json. Its source text says the pair is
  // "about 2500 m apart".
  const lit: Site = {
    id: "sverdrup-pair-lit",
    name: "Lit ground near Sverdrup (computed)",
    lat: -88.8259,
    lon: -158.662,
    elevation_m: -258,
    source: "test",
  };
  const shadow: Site = {
    id: "sverdrup-pair-shadow",
    name: "Shadowed ground near Sverdrup (computed)",
    lat: -88.8053,
    lon: -162.5642,
    elevation_m: -272,
    source: "test",
  };
  assert.equal(pairLabel(lit, shadow), "pair · 2.5 km");
});

test("pairPartnerId finds the other site of a pair, either way round", () => {
  const pairs = [
    ["shackleton-ridge", "shackleton-shadow"],
    ["sverdrup-pair-lit", "sverdrup-pair-shadow"],
  ];
  assert.equal(pairPartnerId("shackleton-ridge", pairs), "shackleton-shadow");
  assert.equal(pairPartnerId("shackleton-shadow", pairs), "shackleton-ridge");
  assert.equal(pairPartnerId("sverdrup-pair-shadow", pairs), "sverdrup-pair-lit");
  assert.equal(pairPartnerId("haworth-candidate", pairs), null);
  assert.equal(pairPartnerId("shackleton-ridge", []), null);
});

test("monthLaneStrengths divides by the hours in that month", () => {
  // February has 28 * 24 = 672 hours.
  const february = monthLaneStrengths(1, 336, 672);
  assert.ok(Math.abs(february.power - 0.65) < 1e-9);
  assert.equal(february.comms, 1);

  // January has 31 * 24 = 744 hours.
  const january = monthLaneStrengths(0, 372, 0);
  assert.ok(Math.abs(january.power - 0.65) < 1e-9);
  assert.equal(january.comms, 0);
});
