// Calendar helpers. The data covers calendar year 2027, one sample per hour,
// and hour 0 is 2027-01-01 00:00 UTC. A month is a number from 0 (January)
// to 11 (December).

export const YEAR = 2027;

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
