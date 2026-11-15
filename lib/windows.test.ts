import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { customSiteHourly } from "./custom-site.ts";
import type { Ephemeris } from "./data.ts";
import {
  countGoodDays,
  dayRuns,
  landingDays,
  landingHours,
  longestDarkSpell,
  nextLandingHour,
  type MissionNeeds,
} from "./windows.ts";

// A mission that only cares about its length: no Sun or Earth share needed,
// and any amount of dark allowed.
function needsOfLength(lengthHours: number): MissionNeeds {
  return {
    lengthHours: lengthHours,
    minSunShare: 0,
    minEarthShare: 0,
    maxDarkHours: 1000,
  };
}

test("longestDarkSpell finds the longest run of 0s", () => {
  assert.equal(longestDarkSpell([1, 0, 0, 1, 0, 0, 0, 1], 0, 8), 3);
  assert.equal(longestDarkSpell([1, 1, 1], 0, 3), 0);
});

test("longestDarkSpell only counts dark hours inside the range", () => {
  // The dark spell is 4 hours long, but only 2 of them are from hour 2 on.
  assert.equal(longestDarkSpell([0, 0, 0, 0, 1, 1], 2, 6), 2);
});

test("a landing hour needs the Sun up at touchdown", () => {
  const sun = [0, 1, 1, 1];
  const earth = [1, 1, 1, 1];
  assert.deepEqual(landingHours(sun, earth, needsOfLength(2)), [0, 1, 1, 0]);
});

test("a stay that runs past the end of the data does not count", () => {
  const sun = [1, 1, 1, 1];
  const earth = [1, 1, 1, 1];
  // A 3 hour stay fits from hour 0 and hour 1 only.
  assert.deepEqual(landingHours(sun, earth, needsOfLength(3)), [1, 1, 0, 0]);
});

test("landingHours checks the Sun share, the Earth share and the dark limit", () => {
  const sun = [1, 1, 0, 0, 1, 1, 1, 1];
  const earth = [0, 0, 1, 1, 1, 1, 1, 1];

  // 4 hour stays. From hour 0 the Sun is up 2 of 4 hours, from hour 4 all 4.
  const sunNeeds = needsOfLength(4);
  sunNeeds.minSunShare = 0.75;
  assert.deepEqual(landingHours(sun, earth, sunNeeds), [0, 0, 0, 0, 1, 0, 0, 0]);

  // Earth is in view 2 of 4 hours from hour 0, and 3 of 4 from hour 1.
  const earthNeeds = needsOfLength(4);
  earthNeeds.minEarthShare = 0.75;
  assert.deepEqual(landingHours(sun, earth, earthNeeds), [0, 1, 0, 0, 1, 0, 0, 0]);

  // The 2 hour dark spell rules out the stays that include all of it.
  const darkNeeds = needsOfLength(4);
  darkNeeds.maxDarkHours = 1;
  assert.deepEqual(landingHours(sun, earth, darkNeeds), [0, 0, 0, 0, 1, 0, 0, 0]);
});

test("landingDays marks a day with at least one landing hour", () => {
  const works: number[] = [];
  for (let hour = 0; hour < 72; hour++) {
    works.push(0);
  }
  // One good hour on day 0, two on day 2, none on day 1.
  works[5] = 1;
  works[48] = 1;
  works[71] = 1;

  const days = landingDays(works);
  assert.deepEqual(days, [1, 0, 1]);
  assert.equal(countGoodDays(days), 2);
});

test("nextLandingHour finds the first good hour at or after a start", () => {
  const works = [0, 1, 0, 0, 1, 0];
  assert.equal(nextLandingHour(works, 0), 1);
  assert.equal(nextLandingHour(works, 1), 1);
  assert.equal(nextLandingHour(works, 2), 4);
  assert.equal(nextLandingHour(works, 5), null);
});

test("dayRuns groups good days that follow each other", () => {
  assert.deepEqual(dayRuns([0, 1, 1, 0, 1]), [
    { startDay: 1, dayCount: 2 },
    { startDay: 4, dayCount: 1 },
  ]);
  assert.deepEqual(dayRuns([0, 0]), []);
});

// Known answer. NASA's Moon Fact Sheet gives the synodic period (one sunrise
// to the next) as 29.53 days:
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
// Near the equator daylight is half of that, about 14.77 days. So at the
// Apollo 11 site a mission that needs the Sun for its whole stay can last 14
// days, but never 15.
test("at Apollo 11 a fully sunlit stay fits in 14 days and not in 15", () => {
  const ephemeris = JSON.parse(
    readFileSync("public/data/ephemeris.json", "utf8"),
  ) as Ephemeris;
  const hourly = customSiteHourly(0.67416, 23.47314, ephemeris);

  const fourteenDays = needsOfLength(14 * 24);
  fourteenDays.minSunShare = 1;
  const fifteenDays = needsOfLength(15 * 24);
  fifteenDays.minSunShare = 1;

  const worksFor14 = landingHours(hourly.sun_visible, hourly.earth_visible, fourteenDays);
  const worksFor15 = landingHours(hourly.sun_visible, hourly.earth_visible, fifteenDays);

  assert.ok(countGoodDays(landingDays(worksFor14)) > 0);
  assert.equal(countGoodDays(landingDays(worksFor15)), 0);
});
