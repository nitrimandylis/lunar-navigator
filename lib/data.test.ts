import assert from "node:assert/strict";
import { test } from "node:test";

import { readFileSync } from "node:fs";

import {
  dataFolder,
  hoursUntilChange,
  joinEphemeris,
  joinHourly,
  sunPercent,
  totalsByMonth,
  type Ephemeris,
  type SiteSummary,
  type SiteHourly,
} from "./data.ts";
import { TOTAL_HOURS, YEARS } from "./time.ts";

// Builds one summary day. bothHours is 0 unless given. The two fields the
// helpers do not read are zero.
function day(date: string, sunHours: number, earthHours: number, bothHours: number = 0) {
  return {
    date: date,
    sun_hours: sunHours,
    earth_hours: earthHours,
    both_hours: bothHours,
    max_sun_elev_deg: 0,
    longest_sun_gap_hours: 0,
  };
}

test("totalsByMonth returns 48 months of zeros for no days", () => {
  const totals = totalsByMonth([]);
  // 4 years of 12 months.
  assert.equal(totals.length, 48);
  for (const monthTotals of totals) {
    assert.deepEqual(monthTotals, { sunHours: 0, earthHours: 0, bothHours: 0 });
  }
});

test("totalsByMonth sums the days of one month", () => {
  const days = [
    day("2027-03-01", 10, 4, 3),
    day("2027-03-02", 5, 0),
    day("2027-03-03", 0, 24),
  ];
  const totals = totalsByMonth(days);
  // March is index 2, because January is index 0.
  assert.deepEqual(totals[2], { sunHours: 15, earthHours: 28, bothHours: 3 });
  assert.deepEqual(totals[1], { sunHours: 0, earthHours: 0, bothHours: 0 });
  assert.deepEqual(totals[3], { sunHours: 0, earthHours: 0, bothHours: 0 });
});

test("totalsByMonth keeps days on each side of a month boundary apart", () => {
  const days = [
    day("2027-01-31", 7, 1),
    day("2027-02-01", 20, 2),
    day("2027-11-30", 3, 9),
    day("2027-12-01", 4, 8),
    day("2027-12-31", 6, 5),
  ];
  const totals = totalsByMonth(days);
  assert.deepEqual(totals[0], { sunHours: 7, earthHours: 1, bothHours: 0 });
  assert.deepEqual(totals[1], { sunHours: 20, earthHours: 2, bothHours: 0 });
  assert.deepEqual(totals[10], { sunHours: 3, earthHours: 9, bothHours: 0 });
  assert.deepEqual(totals[11], { sunHours: 10, earthHours: 13, bothHours: 0 });
});

test("totalsByMonth gives February 2027 its 28 days", () => {
  // 2027 is not a leap year, so February ends on the 28th.
  const days = [];
  for (let dayOfMonth = 1; dayOfMonth <= 28; dayOfMonth++) {
    const twoDigits = String(dayOfMonth).padStart(2, "0");
    days.push(day("2027-02-" + twoDigits, 24, 1));
  }
  days.push(day("2027-03-01", 2, 2));

  const totals = totalsByMonth(days);
  assert.deepEqual(totals[1], { sunHours: 28 * 24, earthHours: 28, bothHours: 0 });
  assert.deepEqual(totals[2], { sunHours: 2, earthHours: 2, bothHours: 0 });
});

test("totalsByMonth keeps the years apart", () => {
  const days = [
    day("2027-02-10", 5, 1),
    day("2028-02-29", 7, 2),
    day("2030-12-31", 3, 4),
    // Outside the years with data: ignored.
    day("2031-01-01", 9, 9),
  ];
  const totals = totalsByMonth(days);
  assert.deepEqual(totals[1], { sunHours: 5, earthHours: 1, bothHours: 0 });
  // February 2028 is month 12 + 1.
  assert.deepEqual(totals[13], { sunHours: 7, earthHours: 2, bothHours: 0 });
  assert.deepEqual(totals[47], { sunHours: 3, earthHours: 4, bothHours: 0 });
});

test("dataFolder keeps 2027 where it was and gives later years a folder", () => {
  assert.equal(dataFolder(2027), "/data/");
  assert.equal(dataFolder(2028), "/data/2028/");
  assert.equal(dataFolder(2030), "/data/2030/");
});

// One hourly file with the same value in every array.
function makeHourly(startUtc: string, values: number[]): SiteHourly {
  return {
    id: "test-site",
    start_utc: startUtc,
    step_minutes: 60,
    count: values.length,
    sun_elev_deg: values,
    sun_az_deg: values,
    earth_elev_deg: values,
    earth_az_deg: values,
    sun_visible: values,
    earth_visible: values,
    horizon: { az_step_deg: 1, elev_deg: [0.5] },
  };
}

test("joinHourly puts the years one after the other", () => {
  const joined = joinHourly([
    makeHourly("2027-01-01T00:00:00Z", [1, 0]),
    makeHourly("2028-01-01T00:00:00Z", [0, 1, 1]),
  ]);
  assert.equal(joined.id, "test-site");
  assert.equal(joined.start_utc, "2027-01-01T00:00:00Z");
  assert.equal(joined.count, 5);
  assert.deepEqual(joined.sun_visible, [1, 0, 0, 1, 1]);
  assert.deepEqual(joined.earth_az_deg, [1, 0, 0, 1, 1]);
  assert.deepEqual(joined.horizon, { az_step_deg: 1, elev_deg: [0.5] });
});

test("joinEphemeris puts the years one after the other", () => {
  const joined = joinEphemeris([
    {
      start_utc: "2027-01-01T00:00:00Z",
      step_minutes: 60,
      count: 1,
      sub_solar_lon_deg: [1],
      sub_solar_lat_deg: [2],
      sub_earth_lon_deg: [3],
      sub_earth_lat_deg: [4],
      earth_distance_km: [5],
    },
    {
      start_utc: "2028-01-01T00:00:00Z",
      step_minutes: 60,
      count: 2,
      sub_solar_lon_deg: [6, 7],
      sub_solar_lat_deg: [8, 9],
      sub_earth_lon_deg: [10, 11],
      sub_earth_lat_deg: [12, 13],
      earth_distance_km: [14, 15],
    },
  ]);
  assert.equal(joined.start_utc, "2027-01-01T00:00:00Z");
  assert.equal(joined.count, 3);
  assert.deepEqual(joined.sub_solar_lon_deg, [1, 6, 7]);
  assert.deepEqual(joined.earth_distance_km, [5, 14, 15]);
});

// Known answer: the real files of one site, joined, cover every hour of the
// four years, and the first hour of 2028 sits right after the last of 2027.
test("the real yearly files of a site join into one timeline", () => {
  const parts: SiteHourly[] = [];
  const ephemerisParts: Ephemeris[] = [];
  for (const year of YEARS) {
    const folder = "public" + dataFolder(year);
    parts.push(JSON.parse(readFileSync(folder + "sites/shackleton-ridge.json", "utf8")));
    ephemerisParts.push(JSON.parse(readFileSync(folder + "ephemeris.json", "utf8")));
  }

  const joined = joinHourly(parts);
  assert.equal(joined.count, TOTAL_HOURS);
  assert.equal(joined.sun_visible.length, TOTAL_HOURS);
  assert.equal(joined.sun_elev_deg[8760], parts[1].sun_elev_deg[0]);
  assert.equal(joined.sun_elev_deg[8759], parts[0].sun_elev_deg[8759]);

  assert.equal(joinEphemeris(ephemerisParts).earth_distance_km.length, TOTAL_HOURS);
});

test("totalsByMonth matches a real month of data", () => {
  // Source: public/data/summary/shackleton-ridge.json, the 31 days of
  // January 2027, copied as written.
  const january = [
    { date: "2027-01-01", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.49, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-02", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.521, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-03", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.529, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-04", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.528, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-05", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.509, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-06", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.464, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-07", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.395, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-08", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 1.303, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-09", sun_hours: 24.0, earth_hours: 15.0, both_hours: 15.0, max_sun_elev_deg: 1.192, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-10", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 1.066, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-11", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.93, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-12", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.788, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-13", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.647, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-14", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.512, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-15", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.387, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-16", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.276, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-17", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.184, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-18", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.114, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-19", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.065, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-20", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.041, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-21", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.059, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-22", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.099, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-23", sun_hours: 24.0, earth_hours: 24.0, both_hours: 24.0, max_sun_elev_deg: 0.157, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-24", sun_hours: 24.0, earth_hours: 12.0, both_hours: 12.0, max_sun_elev_deg: 0.23, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-25", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.312, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-26", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.4, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-27", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.488, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-28", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.571, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-29", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.644, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-30", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.702, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-31", sun_hours: 24.0, earth_hours: 0.0, both_hours: 0.0, max_sun_elev_deg: 0.741, longest_sun_gap_hours: 0.0 },
  ];

  const totals = totalsByMonth(january);
  // Sums of the three hour columns above, added up by hand from the file.
  assert.deepEqual(totals[0], { sunHours: 744, earthHours: 363, bothHours: 363 });
  assert.deepEqual(totals[1], { sunHours: 0, earthHours: 0, bothHours: 0 });
});

test("hoursUntilChange counts the hours until the value flips", () => {
  // Up at hours 0 to 2, down from hour 3: sunset is 3 hours after hour 0.
  assert.equal(hoursUntilChange([1, 1, 1, 0, 0, 1], 0), 3);
  assert.equal(hoursUntilChange([1, 1, 1, 0, 0, 1], 2), 1);
  // Down at hour 3, up again at hour 5: sunrise is 2 hours after hour 3.
  assert.equal(hoursUntilChange([1, 1, 1, 0, 0, 1], 3), 2);
});

test("hoursUntilChange returns null when the value never changes", () => {
  assert.equal(hoursUntilChange([1, 1, 1, 1], 0), null);
  assert.equal(hoursUntilChange([0, 0, 0, 0], 2), null);
  // The only change is before fromIndex, so it does not count.
  assert.equal(hoursUntilChange([0, 1, 1, 1], 1), null);
});

test("hoursUntilChange finds a change at the last index", () => {
  assert.equal(hoursUntilChange([1, 1, 1, 0], 0), 3);
  assert.equal(hoursUntilChange([1, 1, 1, 0], 2), 1);
});

test("hoursUntilChange returns null when fromIndex is the last index", () => {
  assert.equal(hoursUntilChange([1, 0, 1, 0], 3), null);
});

test("hoursUntilChange returns null for a fromIndex outside the array", () => {
  assert.equal(hoursUntilChange([1, 0, 1], 3), null);
  assert.equal(hoursUntilChange([1, 0, 1], -1), null);
  assert.equal(hoursUntilChange([1, 0, 1], 0.5), null);
  assert.equal(hoursUntilChange([], 0), null);
});

test("hoursUntilChange matches a real 48 hours of data", () => {
  // Source: data/out/sites/shackleton-candidate.json, site
  // "shackleton-candidate", sun_visible, the first 48 hours
  // (2027-01-01 00:00 UTC to 2027-01-02 23:00 UTC).
  const sunVisible = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  // Worked out by reading the rows above: the Sun is up for hours 0 to 29
  // and sets at hour 30 (2027-01-02 06:00 UTC).
  assert.equal(hoursUntilChange(sunVisible, 0), 30);
  assert.equal(hoursUntilChange(sunVisible, 24), 6);
  assert.equal(hoursUntilChange(sunVisible, 29), 1);
  // From hour 30 on it stays down until the excerpt ends.
  assert.equal(hoursUntilChange(sunVisible, 30), null);
});

test("sunPercent is the share of all hours with the Sun in view", () => {
  assert.equal(sunPercent([]), 0);
  // 12 + 24 = 36 of 48 hours.
  assert.equal(sunPercent([day("2027-01-01", 12, 0), day("2027-01-02", 24, 0)]), 75);
});

test("the lit ridge near Shackleton has the Sun for 90.6% of 2027", () => {
  // data/FACTS-FOR-STORY.md: 7,936 of the 8,760 hours of 2027, which is 90.6%.
  const summary: SiteSummary = JSON.parse(
    readFileSync("public/data/summary/shackleton-ridge.json", "utf8"),
  );
  assert.equal(summary.days.length, 365);
  assert.equal(sunPercent(summary.days).toFixed(1), "90.6");
});
