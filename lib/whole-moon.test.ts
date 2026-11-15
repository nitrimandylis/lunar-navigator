import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { elevationDeg } from "./custom-site.ts";
import type { Ephemeris } from "./data.ts";
import { REFERENCE_SITES } from "./reference-sites.ts";
import {
  darkPoleLatDeg,
  dotLabel,
  lonLatToXY,
  nightPath,
  terminatorLatDeg,
  wrapLonDeg,
} from "./whole-moon.ts";

// One astronomical unit in km, the Sun distance custom-site.ts uses.
const AU_KM = 149_597_870.7;

// The real Sun and Earth positions the app serves, from JPL Horizons.
const ephemeris = JSON.parse(
  readFileSync("public/data/ephemeris.json", "utf8"),
) as Ephemeris;

// Hour 0 is 2027-01-01 00:00 UTC.
const SUB_SOLAR_LON = ephemeris.sub_solar_lon_deg[0];
const SUB_SOLAR_LAT = ephemeris.sub_solar_lat_deg[0];
const SUB_EARTH_LON = ephemeris.sub_earth_lon_deg[0];
const SUB_EARTH_LAT = ephemeris.sub_earth_lat_deg[0];

// Passes when actual is within tolerance of expected.
function assertClose(actual: number, expected: number, tolerance: number, label: string) {
  const difference = Math.abs(actual - expected);
  assert.ok(
    difference <= tolerance,
    label + ": got " + actual + ", expected " + expected + " within " + tolerance,
  );
}

// The x and y numbers of every point of a path like "M0,180 L2,0 Z".
function pathPoints(path: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const part of path.split(" ")) {
    if (part === "Z") {
      continue;
    }
    // Drop the letter, then split "2,0" into its two numbers.
    const numbers = part.slice(1).split(",");
    points.push({ x: Number(numbers[0]), y: Number(numbers[1]) });
  }
  return points;
}

test("hour 0 of ephemeris.json holds the values these tests rely on", () => {
  assert.equal(SUB_SOLAR_LON, 263.1159);
  assert.equal(SUB_SOLAR_LAT, -1.0146);
  assert.equal(SUB_EARTH_LON, 7.1872);
  assert.equal(SUB_EARTH_LAT, 5.996);
});

test("wrapLonDeg turns the real 0 to 360 longitudes into -180 to 180", () => {
  // The sub-solar point at hour 0 is on the far side, west of the middle.
  assertClose(wrapLonDeg(SUB_SOLAR_LON), -96.8841, 1e-9, "sub-solar");
  // The sub-Earth point is already inside the range and stays as it is.
  assert.equal(wrapLonDeg(SUB_EARTH_LON), 7.1872);
});

test("wrapLonDeg handles the edges and longitudes far outside the range", () => {
  assert.equal(wrapLonDeg(0), 0);
  assert.equal(wrapLonDeg(179.5), 179.5);
  assert.equal(wrapLonDeg(180), -180);
  assert.equal(wrapLonDeg(-180), -180);
  assert.equal(wrapLonDeg(360), 0);
  assert.equal(wrapLonDeg(-190), 170);
  assert.equal(wrapLonDeg(540), -180);
  // Chang'e 6 is already east-positive between -180 and 180.
  assert.equal(wrapLonDeg(-153.9852), -153.9852);
});

test("lonLatToXY puts longitude 0 in the middle and north at the top", () => {
  assert.deepEqual(lonLatToXY(0, 0, 360, 180), { x: 180, y: 90 });
  assert.deepEqual(lonLatToXY(-180, 90, 360, 180), { x: 0, y: 0 });
  assert.deepEqual(lonLatToXY(180, -90, 360, 180), { x: 360, y: 180 });
  // A map twice as big doubles both numbers.
  assert.deepEqual(lonLatToXY(90, -45, 720, 360), { x: 540, y: 270 });
});

test("lonLatToXY places the real Sun and Earth of hour 0", () => {
  // On a map of 1 unit per degree, x is the longitude plus 180 and y is 90
  // minus the latitude.
  const sun = lonLatToXY(wrapLonDeg(SUB_SOLAR_LON), SUB_SOLAR_LAT, 360, 180);
  assertClose(sun.x, 83.1159, 1e-9, "sun x");
  assertClose(sun.y, 91.0146, 1e-9, "sun y");

  const earth = lonLatToXY(wrapLonDeg(SUB_EARTH_LON), SUB_EARTH_LAT, 360, 180);
  assertClose(earth.x, 187.1872, 1e-9, "earth x");
  assertClose(earth.y, 84.004, 1e-9, "earth y");
});

test("on the terminator of hour 0 the Sun is on the horizon", () => {
  // Every 10 degrees of longitude, all the way round.
  for (let lon = -180; lon < 180; lon += 10) {
    const lat = terminatorLatDeg(lon, SUB_SOLAR_LAT, SUB_SOLAR_LON);
    assert.ok(lat >= -90 && lat <= 90, "latitude " + lat + " at longitude " + lon);
    const sunElevation = elevationDeg(lat, lon, SUB_SOLAR_LAT, SUB_SOLAR_LON, AU_KM);
    assertClose(sunElevation, 0, 0.01, "Sun elevation at longitude " + lon);
  }
});

test("terminatorLatDeg does not break when the sub-solar latitude is 0", () => {
  // The Sun over latitude 0, longitude 0: longitudes within 90 degrees of it
  // are all day, the rest all night.
  assert.equal(terminatorLatDeg(0, 0, 0), -90);
  assert.equal(terminatorLatDeg(60, 0, 0), -90);
  assert.equal(terminatorLatDeg(-60, 0, 0), -90);
  assert.equal(terminatorLatDeg(120, 0, 0), 90);
  assert.equal(terminatorLatDeg(-120, 0, 0), 90);
  assert.equal(terminatorLatDeg(180, 0, 0), 90);

  // Never NaN or infinite, at any longitude, also for a latitude very near 0.
  for (const subLat of [0, 1e-12, -1e-12]) {
    for (let lon = -180; lon <= 180; lon += 2) {
      const lat = terminatorLatDeg(lon, subLat, 0);
      assert.ok(Number.isFinite(lat), "latitude at longitude " + lon);
      assert.ok(lat >= -90 && lat <= 90, "latitude " + lat + " at longitude " + lon);
    }
  }
});

test("darkPoleLatDeg picks the pole the Sun is furthest from", () => {
  assert.equal(darkPoleLatDeg(1.5474), -90);
  assert.equal(darkPoleLatDeg(0), -90);
  // Hour 0: the Sun is just south of the equator, so the north pole is dark.
  assert.equal(darkPoleLatDeg(SUB_SOLAR_LAT), 90);
});

test("Apollo 11 is inside the night shading at hour 0", () => {
  const apollo = REFERENCE_SITES[0];
  assert.equal(apollo.id, "ref-apollo-11");

  // The Sun is about 30.4 degrees below Apollo 11's horizon at that hour.
  const sunElevation = elevationDeg(apollo.lat, apollo.lon, SUB_SOLAR_LAT, SUB_SOLAR_LON, AU_KM);
  assertClose(sunElevation, -30.4, 0.1, "Sun elevation at Apollo 11");

  // Night is between the terminator and the dark pole, here the north pole.
  // At Apollo 11's longitude the terminator is far to the south of the site.
  const edgeLat = terminatorLatDeg(apollo.lon, SUB_SOLAR_LAT, SUB_SOLAR_LON);
  assert.equal(darkPoleLatDeg(SUB_SOLAR_LAT), 90);
  assert.ok(apollo.lat > edgeLat, "Apollo 11 at " + apollo.lat + " is north of " + edgeLat);

  // The same check on the path that is drawn. The dark pole is the top edge,
  // y = 0, so the shading at one x runs from the top down to the path's y.
  // Take the path points just left and right of Apollo 11: the site must be
  // above (smaller y than) both.
  const site = lonLatToXY(wrapLonDeg(apollo.lon), apollo.lat, 360, 180);
  const points = pathPoints(nightPath(SUB_SOLAR_LAT, wrapLonDeg(SUB_SOLAR_LON), 360, 180));
  // points[0] is the corner. points[1] is longitude -180, then one every 2 degrees.
  const indexLeft = 1 + Math.floor(site.x / 2);
  const left = points[indexLeft];
  const right = points[indexLeft + 1];
  assert.ok(left.x <= site.x && site.x <= right.x, "the two points are either side of the site");
  assert.ok(site.y < left.y, "site y " + site.y + " is above the path at " + left.y);
  assert.ok(site.y < right.y, "site y " + site.y + " is above the path at " + right.y);
});

test("a place in daylight at hour 0 is outside the night shading", () => {
  // The sub-solar point itself is the brightest place on the Moon.
  const lon = wrapLonDeg(SUB_SOLAR_LON);
  const edgeLat = terminatorLatDeg(lon, SUB_SOLAR_LAT, SUB_SOLAR_LON);
  // The dark pole is north and the terminator is north of the sub-solar
  // point, so the point is not between the two.
  assert.ok(SUB_SOLAR_LAT < edgeLat, "sub-solar point is south of " + edgeLat);
});

test("nightPath outlines the night half for a Sun over latitude 0, longitude 0", () => {
  const path = nightPath(0, 0, 360, 180);
  const points = pathPoints(path);

  // The corner, then 181 points from longitude -180 to 180, then the far corner.
  assert.equal(points.length, 183);
  assert.ok(!path.includes("NaN"), "no NaN in the path");
  assert.ok(path.endsWith(" Z"), "the path is closed");

  // The dark pole is south, the bottom edge. The far side on the left is all
  // night, so the path runs along the top edge there.
  assert.ok(path.startsWith("M0,180 L0,0 L2,0 L4,0 "), path.slice(0, 40));
  // Longitude 0 is noon: the path is down at the bottom edge, nothing shaded.
  assert.deepEqual(points[91], { x: 180, y: 180 });
  // The far side on the right is night again, and the path closes down the
  // right edge.
  assert.ok(path.endsWith(" L358,0 L360,0 L360,180 Z"), path.slice(-40));
});

test("nightPath follows the real terminator of hour 0", () => {
  const points = pathPoints(nightPath(SUB_SOLAR_LAT, wrapLonDeg(SUB_SOLAR_LON), 360, 180));
  assert.equal(points.length, 183);

  // The north pole is dark, so the path starts and ends on the top edge.
  assert.deepEqual(points[0], { x: 0, y: 0 });
  assert.deepEqual(points[182], { x: 360, y: 0 });

  // Every point on it is a terminator point: turn x and y back into
  // longitude and latitude and the Sun is on the horizon there. The path is
  // rounded to 2 decimals, so allow a little more than for the exact latitude.
  for (let i = 1; i <= 181; i++) {
    const lon = points[i].x - 180;
    const lat = 90 - points[i].y;
    const sunElevation = elevationDeg(lat, lon, SUB_SOLAR_LAT, SUB_SOLAR_LON, AU_KM);
    assertClose(sunElevation, 0, 0.02, "Sun elevation at path point " + i);
  }
});

test("dotLabel shortens a landing to its name and a custom point to its numbers", () => {
  assert.equal(dotLabel("Apollo 11, Mare Tranquillitatis", false), "Apollo 11");
  assert.equal(dotLabel("Chang'e 6, far side", false), "Chang'e 6");
  assert.equal(dotLabel("SLIM", false), "SLIM");
  assert.equal(dotLabel("Custom 12.00, -34.50", true), "12.00, -34.50");
});
