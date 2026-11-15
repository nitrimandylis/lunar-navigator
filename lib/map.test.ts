import assert from "node:assert/strict";
import { test } from "node:test";

import { projectSouthPole } from "./geometry.ts";
import {
  clampLabelX,
  clampView,
  craterLabelSpot,
  kmToMapPx,
  projectForMap,
  unprojectSouthPole,
  zoomView,
} from "./map.ts";

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

test("unprojectSouthPole undoes projectSouthPole", () => {
  // The curated sites plus a few points at the edge and on the axes.
  const points = [
    { lat: -89.3277, lon: 116.8355 },
    { lat: -88.3355, lon: -69.5771 },
    { lat: -85.9166, lon: -4.067 },
    { lat: -83.9405, lon: 100.11 },
    { lat: -80, lon: 0 },
    { lat: -80, lon: 90 },
    { lat: -85, lon: -90 },
    { lat: -81, lon: 179 },
  ];
  for (const point of points) {
    const onMap = projectSouthPole(point.lat, point.lon, 150);
    const back = unprojectSouthPole(onMap.x, onMap.y, 150);
    assertClose(back.lat, point.lat, 1e-9, "lat");
    assertClose(back.lon, point.lon, 1e-9, "lon");
  }
});

test("unprojectSouthPole returns east longitudes past 180 as negative", () => {
  const onMap = projectSouthPole(-85, 270, 150);
  const back = unprojectSouthPole(onMap.x, onMap.y, 150);
  assertClose(back.lat, -85, 1e-9, "lat");
  assertClose(back.lon, -90, 1e-9, "lon");
});

test("unprojectSouthPole puts the centre at the pole", () => {
  const back = unprojectSouthPole(0, 0, 150);
  assertClose(back.lat, -90, 1e-9, "lat");
});

test("unprojectSouthPole uses the edge latitude it is given", () => {
  // With the edge at lat -70, halfway out is lat -80. Straight right is lon 90.
  const back = unprojectSouthPole(100, 0, 200, -70);
  assertClose(back.lat, -80, 1e-9, "lat");
  assertClose(back.lon, 90, 1e-9, "lon");
});

test("kmToMapPx: 10 degrees of latitude fill the whole radius", () => {
  // 10 degrees of a circle with radius 1737.4 km: 303.2335 km.
  assertClose(kmToMapPx(303.2335, 150), 150, 0.001, "pixels");
});

test("kmToMapPx for Shackleton crater", () => {
  // IAU Gazetteer of Planetary Nomenclature: Shackleton is 20.92 km across,
  // so its radius is 10.46 km. 10.46 / 30.3234 * 15 px per degree = 5.174 px.
  assertClose(kmToMapPx(10.46, 150), 5.174, 0.001, "pixels");
});

test("clampLabelX centres a label on its pin when it fits", () => {
  assert.equal(clampLabelX(20, 100, 165), 20);
});

test("clampLabelX pushes a label inwards at the edges", () => {
  // A 100 wide label on a pin at 150 would end at 200, past 165.
  assert.equal(clampLabelX(150, 100, 165), 115);
  assert.equal(clampLabelX(-150, 100, 165), -115);
});

test("projectForMap rounds to 2 decimals and stays within 0.005 of the exact point", () => {
  const exact = projectSouthPole(-84.3, 137.7, 150);
  const point = projectForMap(-84.3, 137.7, 150);
  assert.equal(point.x, Math.round(point.x * 100) / 100);
  assert.equal(point.y, Math.round(point.y * 100) / 100);
  assertClose(point.x, exact.x, 0.005 + 1e-9, "x");
  assertClose(point.y, exact.y, 0.005 + 1e-9, "y");
});

test("zoomView keeps the focus point at the same place in the view", () => {
  const full = { x: -170, y: -170, size: 340 };
  const zoomed = zoomView(full, 50, -20, 0.5, 5, 340);
  assert.equal(zoomed.size, 170);
  // The focus point sat at (220/340, 150/340) of the way across. It still does.
  assertClose((50 - zoomed.x) / zoomed.size, 220 / 340, 1e-12, "x share");
  assertClose((-20 - zoomed.y) / zoomed.size, 150 / 340, 1e-12, "y share");
});

test("zoomView stops at the smallest and largest size", () => {
  const full = { x: -170, y: -170, size: 340 };
  assert.equal(zoomView(full, 0, 0, 2, 5, 340).size, 340);
  assert.equal(zoomView({ x: 0, y: 0, size: 6 }, 3, 3, 0.5, 5, 340).size, 5);
});

test("clampView keeps the view centre inside the limit", () => {
  const moved = clampView({ x: 300, y: -400, size: 20 }, 160);
  assert.deepEqual(moved, { x: 150, y: -170, size: 20 });
  const inside = { x: -10, y: -10, size: 20 };
  assert.deepEqual(clampView(inside, 160), inside);
});

test("craterLabelSpot puts the name outside the outline on the chosen side", () => {
  const centre = { x: 10, y: 20 };
  // A crater 5 wide each way, a gap of 3 and text 11 tall.
  assert.deepEqual(craterLabelSpot(centre, 5, "above", 3, 11), { x: 10, y: 12, anchor: "middle" });
  assert.deepEqual(craterLabelSpot(centre, 5, "below", 3, 11), { x: 10, y: 36, anchor: "middle" });
  assert.deepEqual(craterLabelSpot(centre, 5, "left", 3, 11), { x: 2, y: 23, anchor: "end" });
  assert.deepEqual(craterLabelSpot(centre, 5, "right", 3, 11), { x: 18, y: 23, anchor: "start" });
});
