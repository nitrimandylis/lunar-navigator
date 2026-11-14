import assert from "node:assert/strict";
import { test } from "node:test";

import { SUN_DISTANCE_KM, bodyAngles, projectSouthPole } from "./geometry.ts";

// Passes when actual is within tolerance of expected.
function assertClose(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
) {
  const difference = Math.abs(actual - expected);
  assert.ok(
    difference <= tolerance,
    label + ": got " + actual + ", expected " + expected + " within " + tolerance,
  );
}

// Same idea for azimuths, which wrap around: 359.9 and 0.1 are only 0.2
// degrees apart. Also checks that the azimuth is from 0 up to (not
// including) 360.
function assertAzimuthClose(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
) {
  assert.ok(actual >= 0 && actual < 360, label + ": " + actual + " is not in 0 to 360");
  let difference = Math.abs(actual - expected);
  if (difference > 180) {
    difference = 360 - difference;
  }
  assert.ok(
    difference <= tolerance,
    label + ": got " + actual + ", expected " + expected + " within " + tolerance,
  );
}

// sin and cos of angles like 90 and 180 degrees come out a hair off zero
// (about 1e-14), so the map tests compare with a tiny tolerance.
const PIXEL_TOLERANCE = 1e-9;

test("projectSouthPole puts the pole at the centre", () => {
  const point = projectSouthPole(-90, 0, 200);
  assertClose(point.x, 0, PIXEL_TOLERANCE, "x");
  assertClose(point.y, 0, PIXEL_TOLERANCE, "y");

  // At the pole the longitude does not matter.
  const sameSpot = projectSouthPole(-90, 123, 200);
  assertClose(sameSpot.x, 0, PIXEL_TOLERANCE, "x");
  assertClose(sameSpot.y, 0, PIXEL_TOLERANCE, "y");
});

test("projectSouthPole puts lat -80 lon 0 straight up at the edge", () => {
  const point = projectSouthPole(-80, 0, 200);
  assertClose(point.x, 0, PIXEL_TOLERANCE, "x");
  assertClose(point.y, -200, PIXEL_TOLERANCE, "y");
});

test("projectSouthPole puts lat -80 lon 90 at the right edge", () => {
  const point = projectSouthPole(-80, 90, 200);
  assertClose(point.x, 200, PIXEL_TOLERANCE, "x");
  assertClose(point.y, 0, PIXEL_TOLERANCE, "y");
});

test("projectSouthPole puts lat -85 lon 180 halfway down", () => {
  const point = projectSouthPole(-85, 180, 200);
  assertClose(point.x, 0, PIXEL_TOLERANCE, "x");
  assertClose(point.y, 100, PIXEL_TOLERANCE, "y");
});

test("projectSouthPole uses the edge latitude it is given", () => {
  // With the edge at lat -70, lat -80 is halfway out.
  const point = projectSouthPole(-80, 0, 200, -70);
  assertClose(point.x, 0, PIXEL_TOLERANCE, "x");
  assertClose(point.y, -100, PIXEL_TOLERANCE, "y");
});

test("bodyAngles puts a body straight overhead at its sub-point", () => {
  const angles = bodyAngles(10, 20, 10, 20, 400000);
  assertClose(angles.elevDeg, 90, 1e-6, "elevation");
});

test("bodyAngles gives due north and due east for simple cases", () => {
  // Site on the equator at longitude 30. The body is far away over a point
  // 10 degrees north on the same longitude, so it is due north.
  const north = bodyAngles(0, 30, 10, 30, SUN_DISTANCE_KM);
  assertAzimuthClose(north.azDeg, 0, 1e-6, "north azimuth");
  assertClose(north.elevDeg, 80, 0.001, "north elevation");

  // The body is over a point 10 degrees east on the equator: due east.
  const east = bodyAngles(0, 30, 0, 40, SUN_DISTANCE_KM);
  assertAzimuthClose(east.azDeg, 90, 1e-6, "east azimuth");

  // 10 degrees west: due west, which is 270 and not -90.
  const west = bodyAngles(0, 30, 0, 20, SUN_DISTANCE_KM);
  assertAzimuthClose(west.azDeg, 270, 1e-6, "west azimuth");
});

// Known-answer test against a real source.
//
// The site is the one used in the JPL Horizons fixtures: lon 0.0, lat -89.9,
// altitude 0, no atmosphere. The six rows are the hours 2027-01-01 00:00 to
// 05:00 UTC.
const SITE_LAT_DEG = -89.9;
const SITE_LON_DEG = 0.0;

// How close the answers must be to Horizons, in degrees.
const ELEVATION_TOLERANCE_DEG = 0.01;
const AZIMUTH_TOLERANCE_DEG = 0.05;

// Inputs. Source: data/out/ephemeris.json, the first six hourly entries
// (start_utc 2027-01-01T00:00:00Z, step 60 minutes).
const SUB_SOLAR_LON_DEG = [263.1159, 262.609, 262.1022, 261.5953, 261.0885, 260.5816];
const SUB_SOLAR_LAT_DEG = [-1.0146, -1.0139, -1.0132, -1.0125, -1.0119, -1.0112];
const SUB_EARTH_LON_DEG = [7.1872, 7.166, 7.1444, 7.1223, 7.0997, 7.0766];
const SUB_EARTH_LAT_DEG = [5.996, 6.0239, 6.0513, 6.0781, 6.1045, 6.1303];
const EARTH_DISTANCE_KM = [391461, 391668, 391875, 392079, 392283, 392485];

test("bodyAngles matches JPL Horizons for the Sun", () => {
  // Expected answers. Source: JPL Horizons API, target Sun (10), centre Moon
  // (301), saved in data/tests/fixtures/horizons_sun_pole.json.
  // Column "Azi (a-app) Elev": airless apparent azimuth and elevation,
  // azimuth clockwise from north. Rows are 2027-01-01 00:00 to 05:00 UTC.
  const horizonsAzDeg = [263.113923, 262.607102, 262.100271, 261.593428, 261.086574, 260.579709];
  const horizonsElevDeg = [1.001924, 1.000363, 0.998804, 0.997249, 0.995697, 0.994148];

  for (let hour = 0; hour < 6; hour++) {
    const angles = bodyAngles(
      SITE_LAT_DEG,
      SITE_LON_DEG,
      SUB_SOLAR_LAT_DEG[hour],
      SUB_SOLAR_LON_DEG[hour],
      SUN_DISTANCE_KM,
    );
    assertClose(
      angles.elevDeg,
      horizonsElevDeg[hour],
      ELEVATION_TOLERANCE_DEG,
      "Sun elevation at hour " + hour,
    );
    assertAzimuthClose(
      angles.azDeg,
      horizonsAzDeg[hour],
      AZIMUTH_TOLERANCE_DEG,
      "Sun azimuth at hour " + hour,
    );
  }
});

test("bodyAngles matches JPL Horizons for Earth", () => {
  // Expected answers. Source: JPL Horizons API, target Earth (399), centre
  // Moon (301), saved in data/tests/fixtures/horizons_earth_pole.json.
  // Same column and the same six hours as the Sun test above.
  const horizonsAzDeg = [7.184252, 7.163039, 7.141346, 7.119177, 7.096535, 7.073425];
  const horizonsElevDeg = [-6.149075, -6.176854, -6.204098, -6.230808, -6.256982, -6.282619];

  for (let hour = 0; hour < 6; hour++) {
    const angles = bodyAngles(
      SITE_LAT_DEG,
      SITE_LON_DEG,
      SUB_EARTH_LAT_DEG[hour],
      SUB_EARTH_LON_DEG[hour],
      EARTH_DISTANCE_KM[hour],
    );
    assertClose(
      angles.elevDeg,
      horizonsElevDeg[hour],
      ELEVATION_TOLERANCE_DEG,
      "Earth elevation at hour " + hour,
    );
    assertAzimuthClose(
      angles.azDeg,
      horizonsAzDeg[hour],
      AZIMUTH_TOLERANCE_DEG,
      "Earth azimuth at hour " + hour,
    );
  }
});

// A second known-answer test, at a site away from longitude 0.
//
// At the pole site above, some parts of the formula are almost zero, so a
// wrong sign there would go unnoticed. This site (near Nobile crater,
// lon 53.27, lat -85.28) uses every part. Same six hours, same inputs.
const NOBILE_LAT_DEG = -85.28;
const NOBILE_LON_DEG = 53.27;

test("bodyAngles matches JPL Horizons for the Sun at the Nobile site", () => {
  // Source: JPL Horizons API, target Sun (10), centre Moon (301), saved in
  // data/tests/fixtures/horizons_sun_nobile.json.
  const horizonsAzDeg = [209.888046, 209.381012, 208.873942, 208.366838, 207.859699, 207.352526];
  const horizonsElevDeg = [-3.079774, -3.101079, -3.12206, -3.142717, -3.163047, -3.18305];

  for (let hour = 0; hour < 6; hour++) {
    const angles = bodyAngles(
      NOBILE_LAT_DEG,
      NOBILE_LON_DEG,
      SUB_SOLAR_LAT_DEG[hour],
      SUB_SOLAR_LON_DEG[hour],
      SUN_DISTANCE_KM,
    );
    assertClose(
      angles.elevDeg,
      horizonsElevDeg[hour],
      ELEVATION_TOLERANCE_DEG,
      "Sun elevation at hour " + hour,
    );
    assertAzimuthClose(
      angles.azDeg,
      horizonsAzDeg[hour],
      AZIMUTH_TOLERANCE_DEG,
      "Sun azimuth at hour " + hour,
    );
  }
});

test("bodyAngles matches JPL Horizons for Earth at the Nobile site", () => {
  // Source: JPL Horizons API, target Earth (399), centre Moon (301), saved in
  // data/tests/fixtures/horizons_earth_nobile.json.
  const horizonsAzDeg = [314.174033, 314.154613, 314.134684, 314.11425, 314.093316, 314.071886];
  const horizonsElevDeg = [-2.967003, -2.995996, -3.024483, -3.052465, -3.079941, -3.106909];

  for (let hour = 0; hour < 6; hour++) {
    const angles = bodyAngles(
      NOBILE_LAT_DEG,
      NOBILE_LON_DEG,
      SUB_EARTH_LAT_DEG[hour],
      SUB_EARTH_LON_DEG[hour],
      EARTH_DISTANCE_KM[hour],
    );
    assertClose(
      angles.elevDeg,
      horizonsElevDeg[hour],
      ELEVATION_TOLERANCE_DEG,
      "Earth elevation at hour " + hour,
    );
    assertAzimuthClose(
      angles.azDeg,
      horizonsAzDeg[hour],
      AZIMUTH_TOLERANCE_DEG,
      "Earth azimuth at hour " + hour,
    );
  }
});
