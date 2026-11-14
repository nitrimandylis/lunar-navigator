import assert from "node:assert/strict";
import { test } from "node:test";

import { DAYS_IN_MONTH, firstDayOfMonth, formatHour } from "./time.ts";

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
