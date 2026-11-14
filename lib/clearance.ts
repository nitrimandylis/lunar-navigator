// Helpers for the clearance charts and the selected site panel.
//
// Clearance is how far the top edge of the Sun or Earth disc is above the
// terrain horizon, in degrees. Above 0 the body is in view, below 0 it is
// hidden. This is the same rule data/horizon_mask.py uses for the
// sun_visible and earth_visible flags.

import type { Hourly } from "./app-types.ts";
import { hoursUntilChange } from "./data.ts";

// Apparent radius of the Sun's disc seen from the Moon, in degrees:
// asin(695700 km / 1 AU). The Sun's distance barely changes, so one value is
// enough. custom-site.ts uses this same constant.
export const SUN_RADIUS_DEG = 0.2664;

// Apparent radius of Earth's disc, in degrees. The real value is
// asin(6378.137 / earth_distance_km), between 0.9 and 1.0 through the year,
// but the hourly site file does not carry the Earth distance. Using 0.95 for
// every hour makes the chart up to 0.05 degrees off.
export const EARTH_RADIUS_DEG = 0.95;

export type Body = "sun" | "earth";

// The terrain horizon angle at one azimuth. elevDeg holds one angle per
// azimuth step, starting at north. The nearest step is used, the same way
// data/horizon_mask.py picks it: round(az / step), wrapped past 360.
export function horizonAngleAt(
  elevDeg: number[],
  azStepDeg: number,
  azDeg: number,
): number {
  const stepCount = elevDeg.length;
  const rawIndex = Math.round(azDeg / azStepDeg);
  // The extra "+ stepCount" keeps the index positive for a negative azimuth.
  const index = ((rawIndex % stepCount) + stepCount) % stepCount;
  return elevDeg[index];
}

// Clearance of the Sun or Earth for every hour from startHour up to, but not
// including, endHour. A custom point has no terrain, so its horizon is 0.
export function clearanceSeries(
  hourly: Hourly,
  body: Body,
  startHour: number,
  endHour: number,
): number[] {
  let elevations = hourly.sun_elev_deg;
  let radius = SUN_RADIUS_DEG;
  if (body === "earth") {
    elevations = hourly.earth_elev_deg;
    radius = EARTH_RADIUS_DEG;
  }

  const values: number[] = [];
  for (let i = startHour; i < endHour; i++) {
    let horizonAngle = 0;
    if ("horizon" in hourly) {
      let azimuth = hourly.sun_az_deg[i];
      if (body === "earth") {
        azimuth = hourly.earth_az_deg[i];
      }
      horizonAngle = horizonAngleAt(
        hourly.horizon.elev_deg,
        hourly.horizon.az_step_deg,
        azimuth,
      );
    }
    values.push(elevations[i] + radius - horizonAngle);
  }
  return values;
}

export type YRange = {
  min: number;
  max: number;
};

// The y range for a chart: the data's lowest and highest value, always
// including 0, with 10 percent padding (at least 0.5 degrees) on each side.
export function chartYRange(values: number[]): YRange {
  let lowest = 0;
  let highest = 0;
  for (const value of values) {
    lowest = Math.min(lowest, value);
    highest = Math.max(highest, value);
  }

  const padding = Math.max(0.5, (highest - lowest) * 0.1);
  return { min: lowest - padding, max: highest + padding };
}

// Where to put the y labels: whole multiples of a round step that fall inside
// the range. The step is the smallest one that gives at most 5 labels.
export function yTicks(range: YRange): number[] {
  const steps = [0.5, 1, 2, 5, 10, 20, 30, 45];
  let step = steps[steps.length - 1];
  for (const candidate of steps) {
    const labelCount = Math.floor(range.max / candidate) - Math.ceil(range.min / candidate) + 1;
    if (labelCount <= 5) {
      step = candidate;
      break;
    }
  }

  const ticks: number[] = [];
  for (let n = Math.ceil(range.min / step); n * step <= range.max; n++) {
    let tick = n * step;
    // Math.ceil(-0.4) is -0 in JavaScript. Store a plain 0 instead.
    if (tick === 0) {
      tick = 0;
    }
    ticks.push(tick);
  }
  return ticks;
}

// An SVG path that joins the values from left to right, for example
// "M0,10 L5,12 L10,8". Value i sits at x = i * xStep. yFor turns a value in
// degrees into a y position on the chart.
export function linePath(
  values: number[],
  xStep: number,
  yFor: (value: number) => number,
): string {
  const parts: string[] = [];
  for (let i = 0; i < values.length; i++) {
    let command = "L";
    if (i === 0) {
      command = "M";
    }
    parts.push(command + i * xStep + "," + yFor(values[i]));
  }
  return parts.join(" ");
}

// A wait in whole hours as text: "5 h" below a day, "4 d 3 h" from a day up.
export function formatWait(hours: number): string {
  if (hours < 24) {
    return hours + " h";
  }
  const days = Math.floor(hours / 24);
  const hoursLeft = hours % 24;
  return days + " d " + hoursLeft + " h";
}

// The countdown line for one body, for example "Sunset in 4 d 3 h".
// setWord is used when the body is in view at fromHour ("Sunset"), riseWord
// when it is hidden ("Sunrise").
export function countdownText(
  visible: number[],
  fromHour: number,
  setWord: string,
  riseWord: string,
): string {
  let word = riseWord;
  if (visible[fromHour] === 1) {
    word = setWord;
  }

  const wait = hoursUntilChange(visible, fromHour);
  if (wait === null) {
    // "Earthset" stays capitalised, "Sunset" becomes "sunset".
    let wordInSentence = word;
    if (word === "Sunset" || word === "Sunrise") {
      wordInSentence = word.toLowerCase();
    }
    return "No " + wordInSentence + " before the end of 2027";
  }
  return word + " in " + formatWait(wait);
}
