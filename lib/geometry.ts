// Geometry helper: where a site goes on the flat south pole map.

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
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
