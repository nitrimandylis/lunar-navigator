import assert from "node:assert/strict";
import { test } from "node:test";

import { DAYS_IN_MONTH, firstDayOfMonth, formatHour, moveHourToMonth } from "./time.ts";

test("the months of 2027 add up to 365 days", () => {
  let total = 0;
  for (const days of DAYS_IN_MONTH) {
    total += days;
  }
  assert.equal(total, 365);
});

test("firstDayOfMonth counts the days before a month", () => {
  assert.equal(firstDayOfMonth(0), 0);
  assert.equal(firstDayOfMonth(1), 31);
  // 31 + 28, because 2027 is not a leap year.
  assert.equal(firstDayOfMonth(2), 59);
  assert.equal(firstDayOfMonth(11), 334);
});

test("formatHour names the day, month and hour", () => {
  assert.equal(formatHour(0), "1 Jan 2027, 00:00 UTC");
  assert.equal(formatHour(23), "1 Jan 2027, 23:00 UTC");
  assert.equal(formatHour(24), "2 Jan 2027, 00:00 UTC");
  // Day 59 is 1 March. Hour 5 of that day.
  assert.equal(formatHour(59 * 24 + 5), "1 Mar 2027, 05:00 UTC");
  // The last hour of the year.
  assert.equal(formatHour(8759), "31 Dec 2027, 23:00 UTC");
});

test("moveHourToMonth keeps the day of the month and the hour of the day", () => {
  // 14 Mar 05:00 to July gives 14 Jul 05:00.
  const march14 = (59 + 13) * 24 + 5;
  assert.equal(formatHour(moveHourToMonth(march14, 6)), "14 Jul 2027, 05:00 UTC");
  // 1 Jan 00:00 to December gives 1 Dec 00:00.
  assert.equal(formatHour(moveHourToMonth(0, 11)), "1 Dec 2027, 00:00 UTC");
});

test("moveHourToMonth uses the last day of a shorter month", () => {
  // 31 Jan 05:00 to February gives 28 Feb 05:00 (2027 is not a leap year).
  const january31 = 30 * 24 + 5;
  assert.equal(moveHourToMonth(january31, 1), 58 * 24 + 5);
  // 31 Oct 23:00 to November gives 30 Nov 23:00.
  const october31 = (firstDayOfMonth(9) + 30) * 24 + 23;
  assert.equal(formatHour(moveHourToMonth(october31, 10)), "30 Nov 2027, 23:00 UTC");
});
