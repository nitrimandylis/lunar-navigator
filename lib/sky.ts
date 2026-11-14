// Helpers for the sky panorama: the terrain horizon unrolled from north,
// through east, south and west, back to north, with the Sun and Earth drawn
// at their azimuth and elevation.

import type { YRange } from "./clearance.ts";

// One point in the sky: azimuth clockwise from north, elevation above a
// smooth Moon. Both in degrees.
export type SkyPoint = {
  azDeg: number;
  elevDeg: number;
};

// The elevation range the panorama shows for one site. It covers the terrain
// and every height the Sun and Earth reach in the year, with 1 degree of
// padding, and always includes 0. It depends only on the site, so the picture
// does not jump when the hour changes.
export function skyYRange(
  terrainElevDeg: number[],
  sunElevDeg: number[],
  earthElevDeg: number[],
): YRange {
  let lowest = 0;
  let highest = 0;
  for (const values of [terrainElevDeg, sunElevDeg, earthElevDeg]) {
    for (const value of values) {
      lowest = Math.min(lowest, value);
      highest = Math.max(highest, value);
    }
  }
  return { min: lowest - 1, max: highest + 1 };
}

// The terrain horizon as points from azimuth 0 to 360. The last point repeats
// the first one (north again), so the line reaches the right edge.
export function terrainPoints(elevDeg: number[], azStepDeg: number): SkyPoint[] {
  const points: SkyPoint[] = [];
  for (let i = 0; i <= elevDeg.length; i++) {
    points.push({
      azDeg: i * azStepDeg,
      elevDeg: elevDeg[i % elevDeg.length],
    });
  }
  return points;
}

// The path a body takes across the sky from startHour up to, but not
// including, endHour. It comes back as one or more pieces: when the azimuth
// passes north (jumps between 360 and 0), a new piece starts, so no line is
// drawn straight across the whole picture.
export function bodyTrack(
  azDeg: number[],
  elevDeg: number[],
  startHour: number,
  endHour: number,
): SkyPoint[][] {
  const pieces: SkyPoint[][] = [];
  let piece: SkyPoint[] = [];

  for (let i = startHour; i < endHour; i++) {
    const jumpedPastNorth = i > startHour && Math.abs(azDeg[i] - azDeg[i - 1]) > 180;
    if (jumpedPastNorth) {
      pieces.push(piece);
      piece = [];
    }
    piece.push({ azDeg: azDeg[i], elevDeg: elevDeg[i] });
  }

  if (piece.length > 0) {
    pieces.push(piece);
  }
  return pieces;
}

// An SVG path that joins sky points, for example "M0,10 L5,12". xFor turns an
// azimuth into an x position, yFor turns an elevation into a y position.
export function skyLinePath(
  points: SkyPoint[],
  xFor: (azDeg: number) => number,
  yFor: (elevDeg: number) => number,
): string {
  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    let command = "L";
    if (i === 0) {
      command = "M";
    }
    parts.push(command + xFor(points[i].azDeg) + "," + yFor(points[i].elevDeg));
  }
  return parts.join(" ");
}

// The compass word for an azimuth, to the nearest of eight directions:
// 0 is "N", 90 is "E", 135 is "SE".
export function compassWord(azDeg: number): string {
  const words = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azDeg / 45) % 8;
  return words[index];
}
