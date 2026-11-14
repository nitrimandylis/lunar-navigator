import assert from "node:assert/strict";
import { test } from "node:test";

import { projectSouthPole } from "./geometry.ts";
import { kmToMapPx, unprojectSouthPole } from "./map.ts";

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
