import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { DaySummary, Site, SiteHourly, SiteSummary } from "./data.ts";
import { REFERENCE_SITES } from "./reference-sites.ts";
import { TOUR_STEPS } from "./tour.ts";

// Reads one of the JSON files the app serves from public/data/.
function readData(path: string): unknown {
  return JSON.parse(readFileSync("public/data/" + path, "utf8"));
}

// The days of one month of a site's summary. monthText is like "2027-01".
function daysOfMonth(siteId: string, monthText: string): DaySummary[] {
  const summary = readData("summary/" + siteId + ".json") as SiteSummary;
  return summary.days.filter((day) => day.date.startsWith(monthText));
}

function sunHours(days: DaySummary[]): number {
  let total = 0;
  for (const day of days) {
    total += day.sun_hours;
  }
  return total;
}

test("every tour step selects a site that exists", () => {
  const sites = readData("sites.json") as Site[];
  const knownIds: string[] = [];
  for (const site of sites) {
    knownIds.push(site.id);
  }
  for (const site of REFERENCE_SITES) {
    knownIds.push(site.id);
  }

  for (const step of TOUR_STEPS) {
    assert.ok(knownIds.includes(step.siteId), step.siteId + " is not a known site");
    assert.ok(step.month >= 0 && step.month <= 11);
  }
});

test("step 2 quotes the real January Sun hours of the Shackleton pair", () => {
  const ridgeDays = daysOfMonth("shackleton-ridge", "2027-01");
  const shadowDays = daysOfMonth("shackleton-shadow", "2027-01");
  assert.equal(ridgeDays.length * 24, 744);
  assert.equal(sunHours(ridgeDays), 744);
  assert.equal(sunHours(shadowDays), 0);

  const text = TOUR_STEPS[1].text;
  assert.ok(text.includes("all 744 hours of January"));
  assert.ok(text.includes("0 hours"));
});

test("step 3 quotes the real crater wall and Sun height at the shadowed site", () => {
  const hourly = readData("sites/shackleton-shadow.json") as SiteHourly;
  const lowestGround = Math.min(...hourly.horizon.elev_deg);
  const highestGround = Math.max(...hourly.horizon.elev_deg);
  const highestSun = Math.max(...hourly.sun_elev_deg);

  // "15 to 20 degrees" and "about 2 degrees", to the nearest degree.
  assert.equal(Math.round(lowestGround), 15);
  assert.equal(Math.round(highestGround), 20);
  assert.equal(Math.round(highestSun), 2);

  const text = TOUR_STEPS[2].text;
  assert.ok(text.includes("15 to 20 degrees"));
  assert.ok(text.includes("about 2 degrees"));
});

test("step 4 quotes the real May Sun hours and dark spell of the lit ridge", () => {
  const mayDays = daysOfMonth("shackleton-ridge", "2027-05");
  assert.equal(mayDays.length * 24, 744);
  assert.equal(sunHours(mayDays), 512);

  let longestGap = 0;
  for (const day of mayDays) {
    longestGap = Math.max(longestGap, day.longest_sun_gap_hours);
  }
  assert.equal(longestGap, 162);

  const text = TOUR_STEPS[3].text;
  assert.ok(text.includes("512 of 744 hours"));
  assert.ok(text.includes("162 hours"));
});
