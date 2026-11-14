// Small helpers for the sites grid, the month chips and their labels.

import type { Site } from "./data.ts";
import { distanceKm } from "./geometry.ts";
import { DAYS_IN_MONTH, HOURS_PER_DAY, firstDayOfMonth, formatHour } from "./time.ts";

// How strong a lane is drawn, from 0 to 1. No hours gives 0, so an empty lane
// stays empty. Any hours at all give at least MIN_LANE_OPACITY, so one hour of
// sunlight never fades into the dark cell. From there it rises in step with
// the share of the hours: all of them gives 1. Values outside 0 to 1 are cut.
export const MIN_LANE_OPACITY = 0.3;

export function laneOpacity(hours: number, totalHours: number): number {
  if (totalHours <= 0 || hours <= 0) {
    return 0;
  }
  let share = hours / totalHours;
  if (share > 1) {
    share = 1;
  }
  return MIN_LANE_OPACITY + (1 - MIN_LANE_OPACITY) * share;
}

// A site name without the " (computed)" ending. The grid and the map mark
// computed sites once, in the legend, instead of on every name.
export function shortSiteName(name: string): string {
  const ending = " (computed)";
  if (name.endsWith(ending)) {
    return name.slice(0, name.length - ending.length);
  }
  return name;
}

// The day-of-year numbers of every day in a month, in order.
// February (month 1) gives [31, 32, ..., 58].
export function daysOfMonth(month: number): number[] {
  const firstDay = firstDayOfMonth(month);
  const days: number[] = [];
  for (let i = 0; i < DAYS_IN_MONTH[month]; i++) {
    days.push(firstDay + i);
  }
  return days;
}

// The hour indexes of one day, from its 00:00 hour to its 23:00 hour.
export function hoursOfDay(dayOfYear: number): number[] {
  const firstHour = dayOfYear * HOURS_PER_DAY;
  const hours: number[] = [];
  for (let i = 0; i < HOURS_PER_DAY; i++) {
    hours.push(firstHour + i);
  }
  return hours;
}

// Text for a day, for example "14 Mar 2027".
export function formatDay(dayOfYear: number): string {
  // formatHour gives "14 Mar 2027, 00:00 UTC". Keep the part before the comma.
  const hourText = formatHour(dayOfYear * HOURS_PER_DAY);
  return hourText.split(",")[0];
}

// Hours as short text: whole numbers stay whole ("18"), others get one
// decimal ("2.5").
export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(1);
}

// The words a screen reader says for a day cell, for example
// "Lit ridge, 14 Mar 2027: 18 hours of sunlight, 9 hours with Earth in view".
export function dayCellLabel(
  siteName: string,
  dayOfYear: number,
  sunHours: number,
  earthHours: number,
): string {
  return (
    siteName +
    ", " +
    formatDay(dayOfYear) +
    ": " +
    formatHours(sunHours) +
    " hours of sunlight, " +
    formatHours(earthHours) +
    " hours with Earth in view"
  );
}

// Describes one hour: whether the Sun is up and whether Earth is in view.
// sunVisible and earthVisible are 1 or 0, as in the hourly files.
export function hourStateText(sunVisible: number, earthVisible: number): string {
  let sunText = "Sun down";
  if (sunVisible === 1) {
    sunText = "Sun up";
  }
  let earthText = "Earth out of view";
  if (earthVisible === 1) {
    earthText = "Earth in view";
  }
  return sunText + ", " + earthText;
}

// The tag beside a near pair site, for example "pair · 3.5 km".
export function pairLabel(siteA: Site, siteB: Site): string {
  const km = distanceKm(siteA.lat, siteA.lon, siteB.lat, siteB.lon);
  return "pair · " + km.toFixed(1) + " km";
}

// The id of the other site in a site's near pair, or null if the site is not
// in any pair. pairs is a list of [idA, idB] lists, like NEAR_PAIRS.
export function pairPartnerId(siteId: string, pairs: string[][]): string | null {
  for (const pair of pairs) {
    if (pair[0] === siteId) {
      return pair[1];
    }
    if (pair[1] === siteId) {
      return pair[0];
    }
  }
  return null;
}

// How strong the two lanes of a month chip are: that month's hours divided
// by all the hours in the month. month is 0 for January.
export function monthLaneStrengths(
  month: number,
  sunHours: number,
  earthHours: number,
): { power: number; comms: number } {
  const hoursInMonth = DAYS_IN_MONTH[month] * HOURS_PER_DAY;
  return {
    power: laneOpacity(sunHours, hoursInMonth),
    comms: laneOpacity(earthHours, hoursInMonth),
  };
}
