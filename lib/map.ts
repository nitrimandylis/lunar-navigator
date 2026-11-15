// Helpers for the south pole locator map: the reverse of projectSouthPole in
// geometry.ts, turning a distance in km into map pixels, and the rounded
// projection the map draws with.

import { projectSouthPole } from "./geometry.ts";

// Mean radius of the Moon in km, the same value geometry.ts uses.
const MOON_RADIUS_KM = 1737.4;

// How many km one degree of latitude covers on the Moon (about 30.32 km).
const KM_PER_DEGREE = (2 * Math.PI * MOON_RADIUS_KM) / 360;

// Turns a map point back into a latitude and longitude. It undoes
// projectSouthPole: x and y are pixels from the map centre (the pole), with
// screen y pointing down.
//
// The longitude comes back between -180 and 180 (east positive).
// At the pole itself the longitude has no meaning and comes back as 0.
export function unprojectSouthPole(
  x: number,
  y: number,
  radiusPx: number,
  edgeLatDeg: number = -80,
): { lat: number; lon: number } {
  const degreesFromPoleAtEdge = edgeLatDeg + 90;

  // How far the point is from the centre, in pixels, then in degrees.
  const r = Math.sqrt(x * x + y * y);
  const degreesFromPole = (r * degreesFromPoleAtEdge) / radiusPx;
  const lat = -90 + degreesFromPole;

  // projectSouthPole uses x = r sin(lon) and y = -r cos(lon),
  // so the angle is atan2(x, -y). Math.atan2 returns -pi to pi.
  const lonRadians = Math.atan2(x, -y);
  const lon = (lonRadians * 180) / Math.PI;

  return { lat: lat, lon: lon };
}

// How many map pixels a distance in km covers, with the same scale as
// projectSouthPole (radiusPx pixels from the pole out to edgeLatDeg).
export function kmToMapPx(
  km: number,
  radiusPx: number,
  edgeLatDeg: number = -80,
): number {
  const degreesFromPoleAtEdge = edgeLatDeg + 90;
  const pixelsPerDegree = radiusPx / degreesFromPoleAtEdge;
  const degrees = km / KM_PER_DEGREE;
  return degrees * pixelsPerDegree;
}

// Where to centre a label of the given width under a pin at pinX, so the whole
// label stays between -limit and limit. Labels near the left or right edge get
// pushed inwards; the rest sit centred on their pin.
export function clampLabelX(pinX: number, labelWidth: number, limit: number): number {
  const halfWidth = labelWidth / 2;
  if (pinX + halfWidth > limit) {
    return limit - halfWidth;
  }
  if (pinX - halfWidth < -limit) {
    return -limit + halfWidth;
  }
  return pinX;
}

// projectSouthPole, rounded to 2 decimals (0.01 px). The server and the browser
// can disagree in the last digits of sin and cos, and drawing those digits into
// the SVG breaks hydration. Rounding hides the difference. Use this for drawing
// only: unprojectSouthPole should get the exact point.
export function projectForMap(
  latDeg: number,
  lonDeg: number,
  radiusPx: number,
  edgeLatDeg: number = -80,
): { x: number; y: number } {
  const point = projectSouthPole(latDeg, lonDeg, radiusPx, edgeLatDeg);
  // + 0 turns a rounded -0 into 0.
  return {
    x: Math.round(point.x * 100) / 100 + 0,
    y: Math.round(point.y * 100) / 100 + 0,
  };
}

// The part of the map on screen: a square, x and y its top left corner and
// size its width, all in SVG units. The whole map is { x: -170, y: -170, size: 340 }.
export type MapView = {
  x: number;
  y: number;
  size: number;
};

// Keeps the centre of the view inside the square from -limit to limit, so the
// user cannot pan the map away entirely.
export function clampView(view: MapView, limit: number): MapView {
  const half = view.size / 2;
  let centreX = view.x + half;
  let centreY = view.y + half;
  centreX = Math.min(limit, Math.max(-limit, centreX));
  centreY = Math.min(limit, Math.max(-limit, centreY));
  return { x: centreX - half, y: centreY - half, size: view.size };
}

// Zooms the view by factor (below 1 zooms in) around the point (focusX,
// focusY), which stays at the same place on screen, like zooming a photo
// under the mouse. The new size is kept between minSize and maxSize.
export function zoomView(
  view: MapView,
  focusX: number,
  focusY: number,
  factor: number,
  minSize: number,
  maxSize: number,
): MapView {
  const newSize = Math.min(maxSize, Math.max(minSize, view.size * factor));
  const ratio = newSize / view.size;
  return {
    x: focusX - (focusX - view.x) * ratio,
    y: focusY - (focusY - view.y) * ratio,
    size: newSize,
  };
}

// Which side of a crater its name goes on.
export type LabelSide = "above" | "below" | "left" | "right";

// Where a crater's name is drawn: just outside its outline, on the chosen
// side, with the text anchor that goes with that side. centre and radius are
// the crater's outline in SVG units, gap is the space between the outline and
// the text, and labelSize is the font size. y is the text baseline.
export function craterLabelSpot(
  centre: { x: number; y: number },
  radius: number,
  side: LabelSide,
  gap: number,
  labelSize: number,
): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  if (side === "above") {
    return { x: centre.x, y: centre.y - radius - gap, anchor: "middle" };
  }
  if (side === "left") {
    return { x: centre.x - radius - gap, y: centre.y + gap, anchor: "end" };
  }
  if (side === "right") {
    return { x: centre.x + radius + gap, y: centre.y + gap, anchor: "start" };
  }
  // Below: a full line of text under the outline.
  return { x: centre.x, y: centre.y + radius + labelSize, anchor: "middle" };
}
