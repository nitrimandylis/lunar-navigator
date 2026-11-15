import assert from "node:assert/strict";
import { test } from "node:test";

import type { CustomHourly } from "./custom-site.ts";
import type { SiteHourly } from "./data.ts";
import {
  chartYRange,
  clearanceSeries,
  countdownText,
  formatWait,
  horizonAngleAt,
  linePath,
  yTicks,
} from "./clearance.ts";

// Compares two numbers to 9 decimal places, to ignore floating point noise.
function assertClose(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-9, actual + " is not " + expected);
}

// Real values from public/data/sites/shackleton-ridge.json. The two samples
// are hour 0 and hour 100 of the file. The horizon is zero everywhere except
// the three azimuths these samples use, which are copied from the file.
function shackletonRidgeExcerpt(): SiteHourly {
  const horizon: number[] = [];
  for (let az = 0; az < 360; az++) {
    horizon.push(0);
  }
  horizon[96] = 1.024;
  horizon[146] = 3.277;
  horizon[250] = -0.477;

  return {
    id: "shackleton-ridge",
    start_utc: "2027-01-01T00:00:00Z",
    step_minutes: 60,
    count: 2,
    sun_elev_deg: [0.455, 0.885],
    sun_az_deg: [146.28, 95.56],
    earth_elev_deg: [-6.474, -6.67],
    earth_az_deg: [250.42, 246.53],
    sun_visible: [0, 1],
    earth_visible: [0, 0],
    horizon: { az_step_deg: 1, elev_deg: horizon },
  };
}

test("horizonAngleAt picks the nearest azimuth step and wraps past 360", () => {
  const elevations = [5, 1, 2, 3];
  // Steps of 90 degrees: 0, 90, 180, 270.
  assert.equal(horizonAngleAt(elevations, 90, 100), 1);
  assert.equal(horizonAngleAt(elevations, 90, 140), 2);
  // 350 rounds to step 4, which is north again.
  assert.equal(horizonAngleAt(elevations, 90, 350), 5);
  assert.equal(horizonAngleAt(elevations, 90, -80), 3);
});

test("clearanceSeries on real Shackleton ridge numbers, worked by hand", () => {
  const hourly = shackletonRidgeExcerpt();

  // Hour 0: Sun at 0.455 deg, azimuth 146.28 -> horizon[146] = 3.277.
  // 0.455 + 0.2664 - 3.277 = -2.5556, below the ridge (sun_visible 0).
  // Hour 100: 0.885 + 0.2664 - 1.024 = 0.1274, just above it (sun_visible 1).
  const sun = clearanceSeries(hourly, "sun", 0, 2);
  assertClose(sun[0], -2.5556);
  assertClose(sun[1], 0.1274);

  // Hour 0: Earth at -6.474 deg, azimuth 250.42 -> horizon[250] = -0.477.
  // -6.474 + 0.95 + 0.477 = -5.047.
  const earth = clearanceSeries(hourly, "earth", 0, 1);
  assertClose(earth[0], -5.047);
});

test("clearanceSeries for a custom point uses a flat horizon", () => {
  const hourly: CustomHourly = {
    sun_elev_deg: [1, -1],
    sun_az_deg: [90, 91],
    earth_elev_deg: [2, -2],
    earth_az_deg: [10, 10],
    sun_visible: [1, 0],
    earth_visible: [1, 0],
  };
  const sun = clearanceSeries(hourly, "sun", 0, 2);
  assertClose(sun[0], 1.2664);
  assertClose(sun[1], -0.7336);
  const earth = clearanceSeries(hourly, "earth", 1, 2);
  assertClose(earth[0], -1.05);
});

test("chartYRange pads the data and always keeps zero inside", () => {
  assert.deepEqual(chartYRange([2, 8]), { min: -0.8, max: 8.8 });
  assert.deepEqual(chartYRange([-3, -1]), { min: -3.5, max: 0.5 });
});

test("yTicks gives at most 3 round labels inside the range", () => {
  assert.deepEqual(yTicks({ min: -0.8, max: 8.8 }), [0, 3, 6]);
  assert.deepEqual(yTicks({ min: -3.5, max: 0.5 }), [-2, 0]);
  assert.deepEqual(yTicks({ min: -4.5, max: 4.5 }), [-3, 0, 3]);
});

test("linePath joins the points with M then L", () => {
  const path = linePath([1, 2, 3], 10, (value) => value * 2);
  assert.equal(path, "M0,2 L10,4 L20,6");
});

test("formatWait shows hours below a day and days with hours above", () => {
  assert.equal(formatWait(5), "5 h");
  assert.equal(formatWait(24), "1 d 0 h");
  assert.equal(formatWait(99), "4 d 3 h");
});

test("countdownText picks set or rise and handles no change", () => {
  const visible = [1, 1, 0, 0];
  assert.equal(countdownText(visible, 0, "Sunset", "Sunrise"), "Sunset in 2 h");
  assert.equal(
    countdownText(visible, 2, "Sunset", "Sunrise"),
    "No sunrise before the end of 2030",
  );
  assert.equal(
    countdownText([1, 1], 0, "Earthset", "Earthrise"),
    "No Earthset before the end of 2030",
  );
});
