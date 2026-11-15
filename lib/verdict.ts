// The selected site's month in one plain sentence or two: how much Sun and
// Earth it gets, which of the two is the limit, and the longest dark spell.

import { formatWait } from "./clearance.ts";
import type { DaySummary } from "./data.ts";
import { HOURS_PER_DAY } from "./time.ts";

// When the Sun and Earth percentages are closer than this, neither is called
// the limit.
const CLEAR_GAP_PERCENT = 10;

// From this percentage up, a body counts as in view "almost all month".
const ALMOST_ALWAYS_PERCENT = 90;

// days are the per-day totals of one month. monthName is like "May".
// Returns for example: "In May the Sun is up 47% of the time and Earth is in
// view 100%. Power is the limit here, not the radio link. Longest dark spell:
// 13 d 17 h."
// Returns an empty string when there are no days.
export function monthVerdict(days: DaySummary[], monthName: string): string {
  if (days.length === 0) {
    return "";
  }

  let sunHours = 0;
  let earthHours = 0;
  let longestDarkHours = 0;
  for (const day of days) {
    sunHours += day.sun_hours;
    earthHours += day.earth_hours;
    // Each day carries the whole dark spell that touches it, so the largest
    // value is the longest dark spell that touches this month.
    if (day.longest_sun_gap_hours > longestDarkHours) {
      longestDarkHours = day.longest_sun_gap_hours;
    }
  }

  const totalHours = days.length * HOURS_PER_DAY;
  const sunPercent = Math.round((sunHours / totalHours) * 100);
  const earthPercent = Math.round((earthHours / totalHours) * 100);

  const shares =
    "In " +
    monthName +
    " the Sun is up " +
    sunPercent +
    "% of the time and Earth is in view " +
    earthPercent +
    "%.";

  // Which of the two holds a mission back more.
  let limit = "Power and the radio link are limited about equally.";
  if (sunPercent === 0 && earthPercent === 0) {
    limit = "No sunlight and no view of Earth: no power and no radio link.";
  } else if (earthPercent - sunPercent >= CLEAR_GAP_PERCENT) {
    limit = "Power is the limit here, not the radio link.";
  } else if (sunPercent - earthPercent >= CLEAR_GAP_PERCENT) {
    limit = "The radio link is the limit here, not power.";
  } else if (sunPercent >= ALMOST_ALWAYS_PERCENT && earthPercent >= ALMOST_ALWAYS_PERCENT) {
    limit = "Power and the radio link both hold almost all month.";
  }

  let dark = "The Sun never sets.";
  if (longestDarkHours > 0) {
    dark = "Longest dark spell: " + formatWait(Math.round(longestDarkHours)) + ".";
  }

  return shares + " " + limit + " " + dark;
}
