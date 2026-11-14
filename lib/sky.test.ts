import assert from "node:assert/strict";
import { test } from "node:test";

import {
  bodyTrack,
  compassWord,
  skyLinePath,
  skyYRange,
  terrainPoints,
} from "./sky.ts";

test("skyYRange covers the terrain and both bodies, plus 1 degree each side", () => {
  // The lowest and highest values of the year in
  // public/data/sites/shackleton-shadow.json: the terrain is a crater wall
  // from 14.934 to 19.996 degrees, the Sun stays within -2.156 to 2.142 and
  // Earth within -7.606 to 6.174.
  const range = skyYRange([14.934, 19.996], [-2.156, 2.142], [-7.606, 6.174]);
  assert.deepEqual(range, { min: -8.606, max: 20.996 });
});

test("skyYRange always includes 0", () => {
  assert.deepEqual(skyYRange([3, 4], [5], [6]), { min: -1, max: 7 });
  assert.deepEqual(skyYRange([-3, -4], [-5], [-6]), { min: -7, max: 1 });
});

test("terrainPoints ends back at north", () => {
  // Steps of 90 degrees: north, east, south, west.
  const points = terrainPoints([0.451, 0.515, 0.418, 0.353], 90);
  assert.deepEqual(points, [
    { azDeg: 0, elevDeg: 0.451 },
    { azDeg: 90, elevDeg: 0.515 },
    { azDeg: 180, elevDeg: 0.418 },
    { azDeg: 270, elevDeg: 0.353 },
    { azDeg: 360, elevDeg: 0.451 },
  ]);
});

test("bodyTrack splits the real Sun path where it passes north", () => {
  // Hours 78 to 81 of public/data/sites/connecting-ridge.json: the Sun drifts
  // west past north, so its azimuth goes from 0.36 to 359.85.
  const azimuths = [0.87, 0.36, 359.85, 359.35];
  const elevations = [1.49, 1.49, 1.489, 1.489];
  const pieces = bodyTrack(azimuths, elevations, 0, 4);
  assert.deepEqual(pieces, [
    [
      { azDeg: 0.87, elevDeg: 1.49 },
      { azDeg: 0.36, elevDeg: 1.49 },
    ],
    [
      { azDeg: 359.85, elevDeg: 1.489 },
      { azDeg: 359.35, elevDeg: 1.489 },
    ],
  ]);
});

test("bodyTrack keeps one piece when the azimuth never passes north", () => {
  const pieces = bodyTrack([40.44, 39.93, 39.42], [1.414, 1.417, 1.419], 1, 3);
  assert.deepEqual(pieces, [
    [
      { azDeg: 39.93, elevDeg: 1.417 },
      { azDeg: 39.42, elevDeg: 1.419 },
    ],
  ]);
});

test("bodyTrack of an empty range is empty", () => {
  assert.deepEqual(bodyTrack([10, 20], [1, 2], 1, 1), []);
});

test("skyLinePath joins the points with M and L", () => {
  const points = [
    { azDeg: 0, elevDeg: 1 },
    { azDeg: 90, elevDeg: 2 },
    { azDeg: 180, elevDeg: 0 },
  ];
  // x is 2 units per degree of azimuth, y is 10 units per degree down from 100.
  const path = skyLinePath(
    points,
    (az) => az * 2,
    (elev) => 100 - elev * 10,
  );
  assert.equal(path, "M0,90 L180,80 L360,100");
});

test("compassWord names the nearest of eight directions", () => {
  assert.equal(compassWord(0), "N");
  assert.equal(compassWord(40.44), "NE");
  assert.equal(compassWord(144.47), "SE");
  assert.equal(compassWord(250), "W");
  // 350 is nearer to north than to north-west.
  assert.equal(compassWord(350), "N");
});
