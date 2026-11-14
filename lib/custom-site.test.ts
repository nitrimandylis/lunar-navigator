import assert from "node:assert/strict";
import { test } from "node:test";

import { customSiteHourly, elevationDeg, summarizeDays } from "./custom-site.ts";

const AU_KM = 149_597_870.7;

test("four hours at Nobile match JPL Horizons", () => {
  // Real Horizons output for 2027-01-01 00:00 to 03:00 UTC, copied from
  // data/tests/fixtures. Sub points and Earth distance (in au) come from
  // horizons_subpoints.json. The expected elevations at Nobile crater centre
  // (85.28 S, 53.27 E) come from horizons_sun_nobile.json and
  // horizons_earth_nobile.json.
  const subPoints = {
    sub_solar_lon_deg: [263.115854, 262.609029, 262.102194, 261.595347],
    sub_solar_lat_deg: [-1.01459, -1.013906, -1.013224, -1.012545],
    sub_earth_lon_deg: [7.187181, 7.166019, 7.144375, 7.122255],
    sub_earth_lat_deg: [5.995953, 6.023885, 6.051281, 6.078141],
    earth_distance_km: [
      0.00261675600517 * AU_KM,
      0.00261814215734 * AU_KM,
      0.00261951955028 * AU_KM,
      0.00262088811268 * AU_KM,
    ],
  };
  const expectedSun = [-3.079774, -3.101079, -3.12206, -3.142717];
  const expectedEarth = [-2.967003, -2.995996, -3.024483, -3.052465];

  const hourly = customSiteHourly(-85.28, 53.27, subPoints);

  for (let i = 0; i < 4; i++) {
    // The results are rounded to 3 decimals, so allow 0.002 degrees.
    assert.ok(Math.abs(hourly.sun_elev_deg[i] - expectedSun[i]) < 0.002, `sun hour ${i}`);
    assert.ok(Math.abs(hourly.earth_elev_deg[i] - expectedEarth[i]) < 0.002, `earth hour ${i}`);
  }
  // Both bodies are below the horizon in these hours.
  assert.deepEqual(hourly.sun_visible, [0, 0, 0, 0]);
  assert.deepEqual(hourly.earth_visible, [0, 0, 0, 0]);
});

test("a body is at 90 degrees over its sub point and near 0 a quarter turn away", () => {
  assert.ok(Math.abs(elevationDeg(10, 20, 10, 20, AU_KM) - 90) < 0.001);
  assert.ok(Math.abs(elevationDeg(0, 90, 0, 0, AU_KM)) < 0.001);
});

test("visible flags follow the top edge of each disc on a flat horizon", () => {
  // Hour 0: the Sun is straight overhead and Earth is straight below.
  // Hour 1: the other way round.
  const subPoints = {
    sub_solar_lon_deg: [0, 180],
    sub_solar_lat_deg: [0, 0],
    sub_earth_lon_deg: [180, 0],
    sub_earth_lat_deg: [0, 0],
    earth_distance_km: [384_400, 384_400],
  };
  const hourly = customSiteHourly(0, 0, subPoints);
  assert.deepEqual(hourly.sun_visible, [1, 0]);
  assert.deepEqual(hourly.earth_visible, [0, 1]);
});

test("a disc counts as visible while its centre is just below the horizon", () => {
  // Seen from (0, 0), a body whose sub point is a bit more than 90 degrees of
  // longitude away sits just below the horizon. The Sun's disc has a radius of
  // about 0.266 degrees. Earth's has about 0.951 degrees at 384,400 km.
  // Hour 0: both centres are slightly below 0, but the top edges are above it.
  // Hour 1: both are low enough that the whole disc is hidden.
  const subPoints = {
    sub_solar_lon_deg: [90.1, 90.4],
    sub_solar_lat_deg: [0, 0],
    sub_earth_lon_deg: [90, 91.5],
    sub_earth_lat_deg: [0, 0],
    earth_distance_km: [384_400, 384_400],
  };
  const hourly = customSiteHourly(0, 0, subPoints);

  // The elevations are still those of the centres, so they are below 0.
  assert.ok(hourly.sun_elev_deg[0] < 0 && hourly.sun_elev_deg[0] > -0.266, "sun centre");
  assert.ok(hourly.earth_elev_deg[0] < 0 && hourly.earth_elev_deg[0] > -0.951, "earth centre");
  assert.ok(hourly.sun_elev_deg[1] < -0.266, "sun fully down");
  assert.ok(hourly.earth_elev_deg[1] < -0.951, "earth fully down");

  assert.deepEqual(hourly.sun_visible, [1, 0]);
  assert.deepEqual(hourly.earth_visible, [1, 0]);
});

test("day summaries add up hours, the highest Sun and the longest gap", () => {
  const sunElev: number[] = [];
  const sunVisible: number[] = [];
  const earthVisible: number[] = [];

  // Day 1: Sun up for the first 6 hours, then down for 18. Earth up all day.
  for (let hour = 0; hour < 24; hour++) {
    sunVisible.push(hour < 6 ? 1 : 0);
    sunElev.push(hour < 6 ? 2 - hour * 0.5 : -1);
    earthVisible.push(1);
  }
  // Day 2: Sun down for hours 0 to 3 and 10 to 12, up otherwise. Earth never up.
  for (let hour = 0; hour < 24; hour++) {
    const down = hour <= 3 || (hour >= 10 && hour <= 12);
    sunVisible.push(down ? 0 : 1);
    sunElev.push(down ? -0.5 : 1.25);
    earthVisible.push(0);
  }
  // One extra hour that does not fill a day: it must be ignored.
  sunVisible.push(1);
  sunElev.push(9);
  earthVisible.push(1);

  const days = summarizeDays("2027-01-31T00:00:00Z", sunElev, sunVisible, earthVisible);

  assert.deepEqual(days, [
    {
      date: "2027-01-31",
      sun_hours: 6,
      earth_hours: 24,
      max_sun_elev_deg: 2,
      longest_sun_gap_hours: 18,
    },
    {
      date: "2027-02-01",
      sun_hours: 17,
      earth_hours: 0,
      max_sun_elev_deg: 1.25,
      longest_sun_gap_hours: 4,
    },
  ]);
});
