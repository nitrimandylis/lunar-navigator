import assert from "node:assert/strict";
import { test } from "node:test";

import { readFileSync } from "node:fs";

import {
  MONTH_COUNT,
  TOTAL_DAYS,
  TOTAL_HOURS,
  YEARS,
  daysInMonth,
  firstDayOfMonth,
  firstMonthOfYear,
  formatHour,
  isLeapYear,
  monthName,
  monthOfHour,
  moveHourToMonth,
  stepHour,
  yearOfMonth,
} from "./time.ts";

// The hours of 2027, which is not a leap year.
const HOURS_IN_2027 = 8760;

test("the months of 2027 add up to 365 days", () => {
  let total = 0;
  for (let month = 0; month < 12; month++) {
    total += daysInMonth(month);
  }
  assert.equal(total, 365);
});

test("only 2028 is a leap year, so only its February has 29 days", () => {
  assert.equal(isLeapYear(2027), false);
  assert.equal(isLeapYear(2028), true);
  assert.equal(isLeapYear(2029), false);
  assert.equal(isLeapYear(2030), false);
  // The century rule: 2000 was a leap year, 2100 will not be.
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(2100), false);

  assert.equal(daysInMonth(1), 28);
  assert.equal(daysInMonth(13), 29);
  assert.equal(daysInMonth(25), 28);
});

test("a month index counts months from January 2027", () => {
  assert.equal(yearOfMonth(0), 2027);
  assert.equal(yearOfMonth(11), 2027);
  assert.equal(yearOfMonth(12), 2028);
  assert.equal(yearOfMonth(MONTH_COUNT - 1), 2040);
  assert.equal(firstMonthOfYear(2027), 0);
  assert.equal(firstMonthOfYear(2029), 24);
  assert.equal(monthName(0), "Jan");
  assert.equal(monthName(13), "Feb");
});

test("2027 to 2040 add up to 5114 days", () => {
  // 14 years of 365 days, plus the leap days of 2028, 2032, 2036 and 2040.
  assert.equal(TOTAL_DAYS, 5114);
  assert.equal(TOTAL_HOURS, 5114 * 24);
});

// Known answer: the ephemeris files from JPL Horizons hold one sample per
// hour of each year. Together they must be exactly the hours of the calendar.
test("the calendar has as many hours as the data files", () => {
  let hoursInFiles = 0;
  for (const year of YEARS) {
    const folder = year === 2027 ? "public/data/" : "public/data/" + year + "/";
    const ephemeris = JSON.parse(readFileSync(folder + "ephemeris.json", "utf8"));
    assert.equal(ephemeris.start_utc, year + "-01-01T00:00:00Z");
    hoursInFiles += ephemeris.count;
  }
  assert.equal(hoursInFiles, TOTAL_HOURS);
});

test("the calendar carries on past 2027", () => {
  // 2028 starts on day 365. Its 29 February is day 365 + 31 + 28.
  assert.equal(firstDayOfMonth(12), 365);
  assert.equal(formatHour(365 * 24), "1 Jan 2028, 00:00 UTC");
  assert.equal(formatHour((365 + 31 + 28) * 24 + 7), "29 Feb 2028, 07:00 UTC");
  assert.equal(formatHour(TOTAL_HOURS - 1), "31 Dec 2040, 23:00 UTC");
  assert.equal(monthOfHour(365 * 24), 12);
  assert.equal(monthOfHour(TOTAL_HOURS - 1), MONTH_COUNT - 1);
  // 31 Jan 2028 05:00 moved to February 2028 gives the 29th, a leap day.
  const january31of2028 = (365 + 30) * 24 + 5;
  assert.equal(
    formatHour(moveHourToMonth(january31of2028, 13)),
    "29 Feb 2028, 05:00 UTC",
  );
  // May 2027 moved to May 2029 keeps the day and the hour.
  const may16of2027 = (firstDayOfMonth(4) + 15) * 24 + 7;
  assert.equal(formatHour(moveHourToMonth(may16of2027, 28)), "16 May 2029, 07:00 UTC");
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

test("monthOfHour finds the month on the real 2027 calendar", () => {
  assert.equal(monthOfHour(0), 0);
  // 31 January 23:00 is the last hour of January.
  assert.equal(monthOfHour(31 * 24 - 1), 0);
  // 2027 is not a leap year, so day 59 is 1 March, not 29 February.
  assert.equal(monthOfHour(59 * 24), 2);
  assert.equal(monthOfHour(58 * 24 + 23), 1);
  // The last hour of the year is in December.
  assert.equal(monthOfHour(HOURS_IN_2027 - 1), 11);
});

test("monthOfHour agrees with moveHourToMonth for every month", () => {
  for (let month = 0; month < MONTH_COUNT; month++) {
    assert.equal(monthOfHour(moveHourToMonth(5, month)), month);
  }
});

test("stepHour moves by hours and stops at both ends of the data", () => {
  assert.equal(stepHour(100, 1), 101);
  assert.equal(stepHour(100, -24), 76);
  assert.equal(stepHour(0, -1), 0);
  assert.equal(stepHour(TOTAL_HOURS - 1, 1), TOTAL_HOURS - 1);
  assert.equal(stepHour(TOTAL_HOURS - 3, 24), TOTAL_HOURS - 1);
});
