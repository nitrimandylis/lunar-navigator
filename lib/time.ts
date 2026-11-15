// Calendar helpers. The data covers calendar year 2027, one sample per hour,
// and hour 0 is 2027-01-01 00:00 UTC. A month is a number from 0 (January)
// to 11 (December).

export const YEAR = 2027;

export const HOURS_PER_DAY = 24;

// 365 days of 24 hours. The last hour index is one less than this.
export const HOURS_IN_YEAR = 8760;

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

// 2027 is not a leap year, so February has 28 days.
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// The day of the year on which a month starts, counting 1 January as day 0.
// January starts on day 0, February on day 31, March on day 59.
export function firstDayOfMonth(month: number): number {
  let day = 0;
  for (let earlierMonth = 0; earlierMonth < month; earlierMonth++) {
    day += DAYS_IN_MONTH[earlierMonth];
  }
  return day;
}

// Text for an hour index, for example "14 Mar 2027, 05:00 UTC".
export function formatHour(hourIndex: number): string {
  const dayOfYear = Math.floor(hourIndex / HOURS_PER_DAY);
  const hourOfDay = hourIndex % HOURS_PER_DAY;

  // Walk through the months until the day falls inside one.
  let month = 0;
  let dayOfMonth = dayOfYear;
  while (month < 11 && dayOfMonth >= DAYS_IN_MONTH[month]) {
    dayOfMonth -= DAYS_IN_MONTH[month];
    month += 1;
  }

  const hourText = String(hourOfDay).padStart(2, "0");
  return (
    dayOfMonth + 1 + " " + MONTH_NAMES[month] + " " + YEAR + ", " + hourText + ":00 UTC"
  );
}

// Moves an hour index into another month, keeping the day of the month and the
// hour of the day. A day that the new month does not have becomes its last day:
// 31 January 05:00, moved to February, gives 28 February 05:00.
export function moveHourToMonth(hourIndex: number, month: number): number {
  const dayOfYear = Math.floor(hourIndex / HOURS_PER_DAY);
  const hourOfDay = hourIndex % HOURS_PER_DAY;

  // Walk through the months until the day falls inside one (as in formatHour).
  let oldMonth = 0;
  let dayOfMonth = dayOfYear;
  while (oldMonth < 11 && dayOfMonth >= DAYS_IN_MONTH[oldMonth]) {
    dayOfMonth -= DAYS_IN_MONTH[oldMonth];
    oldMonth += 1;
  }

  const lastDayOfNewMonth = DAYS_IN_MONTH[month] - 1;
  if (dayOfMonth > lastDayOfNewMonth) {
    dayOfMonth = lastDayOfNewMonth;
  }

  const newDayOfYear = firstDayOfMonth(month) + dayOfMonth;
  return newDayOfYear * HOURS_PER_DAY + hourOfDay;
}

// The month an hour index falls in. 0 = January.
export function monthOfHour(hourIndex: number): number {
  const dayOfYear = Math.floor(hourIndex / HOURS_PER_DAY);

  // Walk through the months until the day falls inside one (as in formatHour).
  let month = 0;
  let dayOfMonth = dayOfYear;
  while (month < 11 && dayOfMonth >= DAYS_IN_MONTH[month]) {
    dayOfMonth -= DAYS_IN_MONTH[month];
    month += 1;
  }
  return month;
}

// Moves an hour index by a number of hours (negative goes back), stopping at
// the first and the last hour of the year.
export function stepHour(hourIndex: number, hours: number): number {
  const moved = hourIndex + hours;
  if (moved < 0) {
    return 0;
  }
  if (moved > HOURS_IN_YEAR - 1) {
    return HOURS_IN_YEAR - 1;
  }
  return moved;
}

const MS_PER_HOUR = 3_600_000;

// Hour 0 as a timestamp: 2027-01-01 00:00 UTC.
const YEAR_START_MS = Date.UTC(YEAR, 0, 1);

// An hour index as ISO 8601 text, for example "2027-03-14T05:00Z".
// Used in share links and in the CSV export.
export function hourToIso(hourIndex: number): string {
  const date = new Date(YEAR_START_MS + hourIndex * MS_PER_HOUR);
  // "2027-03-14T05:00:00.000Z" cut down to "2027-03-14T05:00", then "Z" again.
  return date.toISOString().slice(0, 16) + "Z";
}

// The opposite of hourToIso. Returns null unless the text is a whole hour of
// 2027 written exactly like "2027-03-14T05:00Z".
export function isoToHour(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:00Z$/.test(text)) {
    return null;
  }
  const hourIndex = (Date.parse(text) - YEAR_START_MS) / MS_PER_HOUR;
  // Date.parse gives NaN for a date that does not exist, like month 13.
  if (!Number.isInteger(hourIndex) || hourIndex < 0 || hourIndex > HOURS_IN_YEAR - 1) {
    return null;
  }
  return hourIndex;
}
