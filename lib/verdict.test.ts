import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { customSiteHourly, summarizeDays } from "./custom-site.ts";
import type { DaySummary, Ephemeris } from "./data.ts";
import { monthVerdict } from "./verdict.ts";

// count days that all have the same hours.
function makeDays(
  count: number,
  sunHours: number,
  earthHours: number,
  darkHours: number,
): DaySummary[] {
  const days: DaySummary[] = [];
  for (let i = 0; i < count; i++) {
    days.push({
      date: "2027-05-01",
      sun_hours: sunHours,
      earth_hours: earthHours,
      both_hours: 0,
      max_sun_elev_deg: 1,
      longest_sun_gap_hours: darkHours,
    });
  }
  return days;
}

test("monthVerdict names power as the limit when the Sun is the scarcer one", () => {
  assert.equal(
    monthVerdict("Site", makeDays(10, 12, 24, 329), "May"),
    "Site: Sun up 50% of May, Earth 100%. " +
      "Power is the limit here, not the radio link. Longest dark spell: 13 d 17 h.",
  );
});

test("monthVerdict names the radio link as the limit when Earth is the scarcer one", () => {
  assert.equal(
    monthVerdict("Site", makeDays(10, 24, 6, 0), "Jan"),
    "Site: Sun up 100% of Jan, Earth 25%. " +
      "The radio link is the limit here, not power. The Sun stays up all of Jan.",
  );
});

test("monthVerdict does not name a limit when the two are close", () => {
  assert.ok(
    monthVerdict("Site", makeDays(10, 12, 13, 5), "Jan").includes(
      "Power and the radio link are limited about equally.",
    ),
  );
  assert.ok(
    monthVerdict("Site", makeDays(10, 23, 24, 5), "Jan").includes(
      "Power and the radio link both hold almost all month.",
    ),
  );
});

test("monthVerdict says so when a site gets neither", () => {
  assert.ok(
    monthVerdict("Site", makeDays(10, 0, 0, 744), "Jan").includes(
      "No sunlight and no view of Earth: no power and no radio link.",
    ),
  );
});

test("monthVerdict gives no text without days", () => {
  assert.equal(monthVerdict("Site", [], "Jan"), "");
});

// Known answer. The Moon is tidally locked, so the near side always faces
// Earth (https://science.nasa.gov/moon/tidal-locking/), and a lunar day is
// 29.53 days, about half of it sunlit
// (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html). So at the
// Apollo 11 site Earth is always in view, the Sun about half the time, and
// power is the limit.
test("at Apollo 11 Earth is always in view and power is the limit", () => {
  const ephemeris = JSON.parse(
    readFileSync("public/data/ephemeris.json", "utf8"),
  ) as Ephemeris;
  const hourly = customSiteHourly(0.67416, 23.47314, ephemeris);
  const days = summarizeDays(
    ephemeris.start_utc,
    hourly.sun_elev_deg,
    hourly.sun_visible,
    hourly.earth_visible,
  );

  const verdict = monthVerdict("Apollo 11", days, "2027");
  assert.ok(verdict.startsWith("Apollo 11: Sun up "), verdict);
  assert.ok(verdict.includes("of 2027, Earth 100%."), verdict);
  // Half the time, give or take a point for the size of the Sun's disc.
  const sunPercent = Number(verdict.split("Sun up ")[1].split("%")[0]);
  assert.ok(sunPercent >= 49 && sunPercent <= 51, verdict);
  // Night at the equator is half a lunar day: about 14.8 days, or 354 hours.
  assert.ok(verdict.includes("Longest dark spell: 14 d"), verdict);
  assert.ok(verdict.includes("Power is the limit here, not the radio link."), verdict);
});
