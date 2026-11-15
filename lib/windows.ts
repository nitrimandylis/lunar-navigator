// Landing windows: the hours of the data at which a mission can land at a
// site and get what it needs for its whole stay.
//
// Everything here works on the sun_visible and earth_visible arrays of one
// site: 1 or 0 per hour, already compared against the terrain.

import { HOURS_PER_DAY } from "./time.ts";

// What a mission needs from the sky, from touchdown to the end of its stay.
export type MissionNeeds = {
  // How long the mission stays on the surface.
  lengthHours: number;
  // The smallest share of the stay with the Sun in view, from 0 to 1.
  minSunShare: number;
  // The smallest share of the stay with Earth in view, from 0 to 1.
  minEarthShare: number;
  // The longest unbroken spell without the Sun the mission can survive.
  maxDarkHours: number;
};

export type MissionPreset = {
  id: string;
  name: string;
  // One line under the name: where the length comes from.
  note: string;
  needs: MissionNeeds;
};

// Starting points, not requirements from any agency. The lengths come from
// real missions. The shares and the dark limit are our own planning
// assumptions, and the planner lets the user change every one of them.
//
// Blue Ghost 1 "lasted for about 14 days, or the equivalent of one lunar day":
// https://www.nasa.gov/news-release/nasa-science-continues-after-fireflys-first-moon-mission-concludes/
// VIPER was planned as a 100 day rover mission at the south pole
// (https://science.nasa.gov/mission/viper/), and "cannot endure more than 50
// hours of continuous darkness" (https://science.nasa.gov/mission/viper/lunar-operations/).
// The rover preset uses that 50 hour limit. (Pages read 15 November 2026.)
export const MISSION_PRESETS: MissionPreset[] = [
  {
    id: "lander",
    name: "Short lander",
    note: "14 days, as long as Blue Ghost 1 worked",
    needs: {
      lengthHours: 14 * HOURS_PER_DAY,
      minSunShare: 0.8,
      minEarthShare: 0.5,
      maxDarkHours: 24,
    },
  },
  {
    id: "crew",
    name: "Crewed stay",
    note: "7 days with people on the surface",
    needs: {
      lengthHours: 7 * HOURS_PER_DAY,
      minSunShare: 0.95,
      minEarthShare: 0.9,
      maxDarkHours: 6,
    },
  },
  {
    id: "rover",
    name: "Long rover",
    note: "100 days and at most 50 h of dark, as planned for VIPER",
    needs: {
      lengthHours: 100 * HOURS_PER_DAY,
      minSunShare: 0.7,
      minEarthShare: 0.5,
      maxDarkHours: 50,
    },
  },
];

// The longest run of hours without the Sun between two hour indexes.
// start is included, end is not. A dark spell that began before start only
// counts from start, because the mission was not there before it landed.
export function longestDarkSpell(
  sunVisible: number[],
  start: number,
  end: number,
): number {
  let longest = 0;
  let current = 0;
  for (let hour = start; hour < end; hour++) {
    if (sunVisible[hour] === 0) {
      current += 1;
      if (current > longest) {
        longest = current;
      }
    } else {
      current = 0;
    }
  }
  return longest;
}

// Running totals of a 1 or 0 array. totals[i] is the sum of the first i
// values, so the number of 1s from hour a up to (not including) hour b is
// totals[b] - totals[a]. This avoids adding up every window again.
function runningTotals(values: number[]): number[] {
  const totals: number[] = [0];
  for (let i = 0; i < values.length; i++) {
    totals.push(totals[i] + values[i]);
  }
  return totals;
}

// One value per hour of the data: 1 if a mission that lands at that hour gets
// what it needs for its whole stay, 0 if not.
//
// A landing hour works when all of these hold:
// - the whole stay fits inside the data (it does not run past the last hour),
// - the Sun is in view at touchdown,
// - the Sun is in view for at least minSunShare of the stay,
// - Earth is in view for at least minEarthShare of the stay,
// - no dark spell during the stay is longer than maxDarkHours.
export function landingHours(
  sunVisible: number[],
  earthVisible: number[],
  needs: MissionNeeds,
): number[] {
  const hourCount = sunVisible.length;
  const length = needs.lengthHours;
  const sunTotals = runningTotals(sunVisible);
  const earthTotals = runningTotals(earthVisible);

  const works: number[] = [];
  for (let hour = 0; hour < hourCount; hour++) {
    const end = hour + length;
    let isGood = length > 0 && end <= hourCount && sunVisible[hour] === 1;

    if (isGood) {
      const sunShare = (sunTotals[end] - sunTotals[hour]) / length;
      const earthShare = (earthTotals[end] - earthTotals[hour]) / length;
      isGood = sunShare >= needs.minSunShare && earthShare >= needs.minEarthShare;
    }
    // The slowest check goes last, so it only runs for hours that passed the rest.
    if (isGood) {
      isGood = longestDarkSpell(sunVisible, hour, end) <= needs.maxDarkHours;
    }

    works.push(isGood ? 1 : 0);
  }
  return works;
}

// One value per UTC day: 1 if at least one hour of that day is a landing hour
// that works, 0 if not. works is the result of landingHours.
export function landingDays(works: number[]): number[] {
  const dayCount = Math.floor(works.length / HOURS_PER_DAY);
  const days: number[] = [];
  for (let day = 0; day < dayCount; day++) {
    let isGood = 0;
    for (let hour = day * HOURS_PER_DAY; hour < (day + 1) * HOURS_PER_DAY; hour++) {
      if (works[hour] === 1) {
        isGood = 1;
      }
    }
    days.push(isGood);
  }
  return days;
}

// How many days are 1.
export function countGoodDays(days: number[]): number {
  let count = 0;
  for (const day of days) {
    count += day;
  }
  return count;
}

// The first landing hour that works at or after fromHour, or null if there is
// none before the data ends.
export function nextLandingHour(works: number[], fromHour: number): number | null {
  for (let hour = Math.max(0, fromHour); hour < works.length; hour++) {
    if (works[hour] === 1) {
      return hour;
    }
  }
  return null;
}

// A run of good days in a row: the day it starts on and how many days it lasts.
export type DayRun = {
  startDay: number;
  dayCount: number;
};

// Groups the good days into runs, so the year strip can draw one bar per run
// instead of one per day. [0, 1, 1, 0, 1] gives a run of 2 from day 1 and a
// run of 1 from day 4.
export function dayRuns(days: number[]): DayRun[] {
  const runs: DayRun[] = [];
  let current: DayRun | null = null;
  for (let day = 0; day < days.length; day++) {
    if (days[day] === 1) {
      if (current === null) {
        current = { startDay: day, dayCount: 0 };
        runs.push(current);
      }
      current.dayCount += 1;
    } else {
      current = null;
    }
  }
  return runs;
}

// The answer for the slip margin column. When the picked day is a good day,
// slipDays is how many days the launch can slip and still land in the same
// run, and nextGoodDay is null. When it is not, slipDays is null and
// nextGoodDay is the first good day after it, or null if there is none.
export type SlipMargin = {
  slipDays: number | null;
  nextGoodDay: number | null;
};

// How far a landing on pickedDay can slip. runs is the result of dayRuns, and
// pickedDay is a day index on the same timeline. With a run of days 2 to 6:
// picked 2 gives a slip of 4, picked 6 a slip of 0, and picked 1 the next good
// day 2.
export function slipMargin(runs: DayRun[], pickedDay: number): SlipMargin {
  for (const run of runs) {
    const lastDay = run.startDay + run.dayCount - 1;
    // The runs are in order, so the first one that ends on or after the picked
    // day either holds it or is the next window.
    if (lastDay >= pickedDay) {
      if (run.startDay <= pickedDay) {
        return { slipDays: lastDay - pickedDay, nextGoodDay: null };
      }
      return { slipDays: null, nextGoodDay: run.startDay };
    }
  }
  return { slipDays: null, nextGoodDay: null };
}
