// Calendar helpers. The data covers the calendar years 2027 to 2030, one
// sample per hour, joined into one timeline.
//
// - An hour index counts hours from 2027-01-01 00:00 UTC, which is hour 0.
// - A day index counts days from 2027-01-01, which is day 0.
// - A month index counts months from January 2027, which is month 0. So 11 is
//   December 2027, 12 is January 2028 and 47 is December 2030.

export const FIRST_YEAR = 2027;
export const LAST_YEAR = 2030;

// The years with data, in order.
export const YEARS = [2027, 2028, 2029, 2030];

export const MONTHS_PER_YEAR = 12;

// The last month index is one less than this.
export const MONTH_COUNT = YEARS.length * MONTHS_PER_YEAR;

export const HOURS_PER_DAY = 24;

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// The days in each month of a year that is not a leap year.
const DAYS_IN_PLAIN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// A leap year has 29 days in February. Every fourth year is one, except a
// century year that cannot be divided by 400. Of our years only 2028 is.
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) {
    return true;
  }
  if (year % 100 === 0) {
    return false;
  }
  return year % 4 === 0;
}

// The calendar year a month index falls in. Month 13 gives 2028.
export function yearOfMonth(month: number): number {
  return FIRST_YEAR + Math.floor(month / MONTHS_PER_YEAR);
}

// The month index of January of a year. 2028 gives 12.
export function firstMonthOfYear(year: number): number {
  return (year - FIRST_YEAR) * MONTHS_PER_YEAR;
}

// The short name of a month index. Month 13 gives "Feb".
export function monthName(month: number): string {
  return MONTH_NAMES[month % MONTHS_PER_YEAR];
}

// How many days a month has. Month 1 (February 2027) gives 28, month 13
// (February 2028) gives 29.
export function daysInMonth(month: number): number {
  const monthOfYear = month % MONTHS_PER_YEAR;
  if (monthOfYear === 1 && isLeapYear(yearOfMonth(month))) {
    return 29;
  }
  return DAYS_IN_PLAIN_MONTH[monthOfYear];
}

// The day index on which a month starts. January 2027 starts on day 0,
// February 2027 on day 31, January 2028 on day 365.
export function firstDayOfMonth(month: number): number {
  let day = 0;
  for (let earlierMonth = 0; earlierMonth < month; earlierMonth++) {
    day += daysInMonth(earlierMonth);
  }
  return day;
}

// Every day of the four years: 365 + 366 + 365 + 365.
export const TOTAL_DAYS = firstDayOfMonth(MONTH_COUNT);

// Every hour of the four years. The last hour index is one less than this.
export const TOTAL_HOURS = TOTAL_DAYS * HOURS_PER_DAY;

// The month a day index falls in, and the day inside that month counted from
// 0. Day 59 (1 March 2027) gives month 2 and dayOfMonth 0.
function monthAndDay(dayIndex: number): { month: number; dayOfMonth: number } {
  // Walk through the months until the day falls inside one.
  let month = 0;
  let dayOfMonth = dayIndex;
  while (month < MONTH_COUNT - 1 && dayOfMonth >= daysInMonth(month)) {
    dayOfMonth -= daysInMonth(month);
    month += 1;
  }
  return { month: month, dayOfMonth: dayOfMonth };
}

// Text for an hour index, for example "14 Mar 2027, 05:00 UTC".
export function formatHour(hourIndex: number): string {
  const dayIndex = Math.floor(hourIndex / HOURS_PER_DAY);
  const hourOfDay = hourIndex % HOURS_PER_DAY;
  const position = monthAndDay(dayIndex);

  const hourText = String(hourOfDay).padStart(2, "0");
  return (
    position.dayOfMonth +
    1 +
    " " +
    monthName(position.month) +
    " " +
    yearOfMonth(position.month) +
    ", " +
    hourText +
    ":00 UTC"
  );
}

// Moves an hour index into another month, keeping the day of the month and the
// hour of the day. A day that the new month does not have becomes its last day:
// 31 January 05:00, moved to February 2027, gives 28 February 05:00.
export function moveHourToMonth(hourIndex: number, month: number): number {
  const dayIndex = Math.floor(hourIndex / HOURS_PER_DAY);
  const hourOfDay = hourIndex % HOURS_PER_DAY;

  let dayOfMonth = monthAndDay(dayIndex).dayOfMonth;
  const lastDayOfNewMonth = daysInMonth(month) - 1;
  if (dayOfMonth > lastDayOfNewMonth) {
    dayOfMonth = lastDayOfNewMonth;
  }

  const newDayIndex = firstDayOfMonth(month) + dayOfMonth;
  return newDayIndex * HOURS_PER_DAY + hourOfDay;
}

// The month an hour index falls in. 0 = January 2027.
export function monthOfHour(hourIndex: number): number {
  const dayIndex = Math.floor(hourIndex / HOURS_PER_DAY);
  return monthAndDay(dayIndex).month;
}

// Moves an hour index by a number of hours (negative goes back), stopping at
// the first and the last hour of the data.
export function stepHour(hourIndex: number, hours: number): number {
  const moved = hourIndex + hours;
  if (moved < 0) {
    return 0;
  }
  if (moved > TOTAL_HOURS - 1) {
    return TOTAL_HOURS - 1;
  }
  return moved;
}

const MS_PER_HOUR = 3_600_000;

// Hour 0 as a timestamp: 2027-01-01 00:00 UTC.
const FIRST_HOUR_MS = Date.UTC(FIRST_YEAR, 0, 1);

// An hour index as ISO 8601 text, for example "2027-03-14T05:00Z".
// Used in share links and in the CSV export.
export function hourToIso(hourIndex: number): string {
  const date = new Date(FIRST_HOUR_MS + hourIndex * MS_PER_HOUR);
  // "2027-03-14T05:00:00.000Z" cut down to "2027-03-14T05:00", then "Z" again.
  return date.toISOString().slice(0, 16) + "Z";
}

// The opposite of hourToIso. Returns null unless the text is a whole hour
// inside the data, written exactly like "2027-03-14T05:00Z".
export function isoToHour(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:00Z$/.test(text)) {
    return null;
  }
  const hourIndex = (Date.parse(text) - FIRST_HOUR_MS) / MS_PER_HOUR;
  // Date.parse gives NaN for a date that does not exist, like month 13.
  if (!Number.isInteger(hourIndex) || hourIndex < 0 || hourIndex > TOTAL_HOURS - 1) {
    return null;
  }
  // A day that does not exist, like 29 February 2027, is quietly moved to the
  // next real day by Date.parse. Writing the hour back out shows the change.
  if (hourToIso(hourIndex) !== text) {
    return null;
  }
  return hourIndex;
}
