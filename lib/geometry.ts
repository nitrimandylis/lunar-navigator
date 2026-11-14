// Geometry helpers: where a site goes on the flat south pole map, and how far
// apart two sites are.

// Mean radius of the Moon in km.
const MOON_RADIUS_KM = 1737.4;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Distance in km between two points on the Moon, measured along the surface
// of a smooth sphere (the haversine formula).
export function distanceKm(
  latADeg: number,
  lonADeg: number,
  latBDeg: number,
  lonBDeg: number,
): number {
  const latA = toRadians(latADeg);
  const latB = toRadians(latBDeg);
  const latDifference = latB - latA;
  const lonDifference = toRadians(lonBDeg - lonADeg);

  // h is between 0 (same point) and 1 (opposite sides of the Moon).
  const h =
    Math.sin(latDifference / 2) * Math.sin(latDifference / 2) +
    Math.cos(latA) *
      Math.cos(latB) *
      Math.sin(lonDifference / 2) *
      Math.sin(lonDifference / 2);

  // The angle between the two points, seen from the Moon's centre.
  const angle = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return MOON_RADIUS_KM * angle;
}

// Places a point on a flat map of the south pole, for an SVG.
// Returns pixels relative to the map centre (the pole). Screen y points down.
//
// The distance from the centre grows evenly with latitude: 0 at the pole
// (lat -90) and radiusPx at edgeLatDeg. Longitude 0 points up (toward Earth)
// and longitude 90 east points right.
export function projectSouthPole(
  latDeg: number,
  lonDeg: number,
  radiusPx: number,
  edgeLatDeg: number = -80,
): { x: number; y: number } {
  const degreesFromPole = latDeg + 90;
  const degreesFromPoleAtEdge = edgeLatDeg + 90;
  const r = (radiusPx * degreesFromPole) / degreesFromPoleAtEdge;

  const lon = toRadians(lonDeg);
  const x = r * Math.sin(lon);
  // Minus, because "up" on a screen is the negative y direction.
  const y = -r * Math.cos(lon);
  return { x: x, y: y };
}
