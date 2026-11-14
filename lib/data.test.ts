import assert from "node:assert/strict";
import { test } from "node:test";

import { hoursUntilChange, totalsByMonth } from "./data.ts";

// Builds one summary day. The two fields the helpers do not read are zero.
function day(date: string, sunHours: number, earthHours: number) {
  return {
    date: date,
    sun_hours: sunHours,
    earth_hours: earthHours,
    max_sun_elev_deg: 0,
    longest_sun_gap_hours: 0,
  };
}

test("totalsByMonth returns 12 months of zeros for no days", () => {
  const totals = totalsByMonth([]);
  assert.equal(totals.length, 12);
  for (const monthTotals of totals) {
    assert.deepEqual(monthTotals, { sunHours: 0, earthHours: 0 });
  }
});

test("totalsByMonth sums the days of one month", () => {
  const days = [
    day("2027-03-01", 10, 4),
    day("2027-03-02", 5, 0),
    day("2027-03-03", 0, 24),
  ];
  const totals = totalsByMonth(days);
  // March is index 2, because January is index 0.
  assert.deepEqual(totals[2], { sunHours: 15, earthHours: 28 });
  assert.deepEqual(totals[1], { sunHours: 0, earthHours: 0 });
  assert.deepEqual(totals[3], { sunHours: 0, earthHours: 0 });
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
  assert.deepEqual(totals[0], { sunHours: 7, earthHours: 1 });
  assert.deepEqual(totals[1], { sunHours: 20, earthHours: 2 });
  assert.deepEqual(totals[10], { sunHours: 3, earthHours: 9 });
  assert.deepEqual(totals[11], { sunHours: 10, earthHours: 13 });
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
  assert.deepEqual(totals[1], { sunHours: 28 * 24, earthHours: 28 });
  assert.deepEqual(totals[2], { sunHours: 2, earthHours: 2 });
});

test("totalsByMonth matches a real month of data", () => {
  // Source: data/out/summary/shackleton-candidate.json, site
  // "shackleton-candidate", the 31 days of January 2027, copied as written.
  const january = [
    { date: "2027-01-01", sun_hours: 24.0, earth_hours: 0.0, max_sun_elev_deg: 0.827, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-02", sun_hours: 6.0, earth_hours: 0.0, max_sun_elev_deg: 0.791, longest_sun_gap_hours: 18.0 },
    { date: "2027-01-03", sun_hours: 0.0, earth_hours: 0.0, max_sun_elev_deg: 0.764, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-04", sun_hours: 0.0, earth_hours: 0.0, max_sun_elev_deg: 0.748, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-05", sun_hours: 0.0, earth_hours: 0.0, max_sun_elev_deg: 0.743, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-06", sun_hours: 0.0, earth_hours: 23.0, max_sun_elev_deg: 0.753, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-07", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.769, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-08", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.791, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-09", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.815, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-10", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.841, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-11", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.865, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-12", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.886, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-13", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.902, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-14", sun_hours: 0.0, earth_hours: 24.0, max_sun_elev_deg: 0.911, longest_sun_gap_hours: 24.0 },
    { date: "2027-01-15", sun_hours: 17.0, earth_hours: 24.0, max_sun_elev_deg: 0.912, longest_sun_gap_hours: 7.0 },
    { date: "2027-01-16", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.911, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-17", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.9, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-18", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.879, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-19", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.846, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-20", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.802, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-21", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.746, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-22", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.682, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-23", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.61, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-24", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.533, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-25", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.454, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-26", sun_hours: 24.0, earth_hours: 24.0, max_sun_elev_deg: 0.374, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-27", sun_hours: 24.0, earth_hours: 21.0, max_sun_elev_deg: 0.297, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-28", sun_hours: 24.0, earth_hours: 0.0, max_sun_elev_deg: 0.225, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-29", sun_hours: 24.0, earth_hours: 0.0, max_sun_elev_deg: 0.159, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-30", sun_hours: 24.0, earth_hours: 0.0, max_sun_elev_deg: 0.102, longest_sun_gap_hours: 0.0 },
    { date: "2027-01-31", sun_hours: 17.0, earth_hours: 0.0, max_sun_elev_deg: 0.053, longest_sun_gap_hours: 7.0 },
  ];

  const totals = totalsByMonth(january);
  // Worked out by reading the rows above.
  // Sun: 24 + 6 on the 1st and 2nd, 17 on the 15th, 15 full days from the
  // 16th to the 30th (15 * 24 = 360), 17 on the 31st. 30 + 17 + 360 + 17 = 424.
  // Earth: 23 on the 6th, 20 full days from the 7th to the 26th
  // (20 * 24 = 480), 21 on the 27th. 23 + 480 + 21 = 524.
  assert.deepEqual(totals[0], { sunHours: 424, earthHours: 524 });
  assert.deepEqual(totals[1], { sunHours: 0, earthHours: 0 });
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
