import assert from "node:assert/strict";
import { test } from "node:test";

import { projectSouthPole } from "./geometry.ts";

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
