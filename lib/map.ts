// Helpers for the south pole locator map: the reverse of projectSouthPole in
// geometry.ts, and turning a distance in km into map pixels.

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
