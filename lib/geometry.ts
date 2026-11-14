// Geometry helpers: where a site goes on the flat south pole map, and where
// the Sun or Earth sits in a site's sky.

// Mean radius of the Moon in km. JPL Horizons uses the same value.
export const MOON_RADIUS_KM = 1737.4;

// 1 astronomical unit in km. Pass this to bodyAngles as the Sun's distance.
export const SUN_DISTANCE_KM = 149597870.7;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
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

// Azimuth and elevation of the Sun or Earth seen from a site on a smooth Moon.
//
// subLatDeg and subLonDeg are the body's sub-point: the place on the Moon
// where the body is straight overhead. distanceKm is how far the body is from
// the Moon's centre. For the Sun pass SUN_DISTANCE_KM. For Earth pass
// earth_distance_km from the ephemeris.
//
// Azimuth is clockwise from north, from 0 up to but not including 360
// (0 = north, 90 = east, 180 = south, 270 = west). Elevation is the angle
// above the flat horizon, negative when the body is below it.
//
// The idea: put the Moon's centre at (0, 0, 0), find where the site and the
// body are in 3D, and look along the line from the site to the body. Because
// the line starts at the site and not at the Moon's centre, the small shift in
// where the nearby Earth appears (parallax) is handled automatically.
export function bodyAngles(
  siteLatDeg: number,
  siteLonDeg: number,
  subLatDeg: number,
  subLonDeg: number,
  distanceKm: number,
): { azDeg: number; elevDeg: number } {
  const siteLat = toRadians(siteLatDeg);
  const siteLon = toRadians(siteLonDeg);
  const subLat = toRadians(subLatDeg);
  const subLon = toRadians(subLonDeg);

  // Direction from the Moon's centre to the site, with length 1.
  // It is also the "up" direction at the site.
  const upX = Math.cos(siteLat) * Math.cos(siteLon);
  const upY = Math.cos(siteLat) * Math.sin(siteLon);
  const upZ = Math.sin(siteLat);

  // The site sits on the surface, one Moon radius along that direction.
  const siteX = MOON_RADIUS_KM * upX;
  const siteY = MOON_RADIUS_KM * upY;
  const siteZ = MOON_RADIUS_KM * upZ;

  // The body sits above its sub-point, distanceKm from the Moon's centre.
  const bodyX = distanceKm * Math.cos(subLat) * Math.cos(subLon);
  const bodyY = distanceKm * Math.cos(subLat) * Math.sin(subLon);
  const bodyZ = distanceKm * Math.sin(subLat);

  // Line of sight: from the site to the body.
  const losX = bodyX - siteX;
  const losY = bodyY - siteY;
  const losZ = bodyZ - siteZ;

  // The two flat directions on the ground at the site.
  // East runs along the line of latitude, so it has no z part.
  const eastX = -Math.sin(siteLon);
  const eastY = Math.cos(siteLon);
  const eastZ = 0;
  // North runs along the line of longitude, toward the north pole.
  const northX = -Math.sin(siteLat) * Math.cos(siteLon);
  const northY = -Math.sin(siteLat) * Math.sin(siteLon);
  const northZ = Math.cos(siteLat);

  // How much of the line of sight points up, east and north (dot products).
  const losUp = losX * upX + losY * upY + losZ * upZ;
  const losEast = losX * eastX + losY * eastY + losZ * eastZ;
  const losNorth = losX * northX + losY * northY + losZ * northZ;

  // Elevation: the up part compared with the part along the ground.
  const alongGround = Math.hypot(losEast, losNorth);
  const elevDeg = toDegrees(Math.atan2(losUp, alongGround));

  // Azimuth: the angle from north toward east. atan2 gives -180 to 180,
  // so a negative answer is moved into 0 to 360.
  let azDeg = toDegrees(Math.atan2(losEast, losNorth));
  if (azDeg < 0) {
    azDeg += 360;
  }
  // A negative answer that is almost zero rounds to exactly 360 after the
  // add. 360 is the same direction as 0, so use 0 to stay below 360.
  if (azDeg >= 360) {
    azDeg = 0;
  }

  return { azDeg: azDeg, elevDeg: elevDeg };
}
