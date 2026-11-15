// Helpers for the whole Moon map: a flat map with longitude across (-180 at
// the left edge, 0 in the middle, 180 at the right edge) and latitude up (90
// at the top, -90 at the bottom), and the night shading drawn on it.

// The terminator is the line between day and night. The night shading follows
// it with one point every this many degrees of longitude.
const TERMINATOR_STEP_DEG = 2;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Brings any longitude into the range -180 (included) to 180 (not included).
// ephemeris.json counts longitude from 0 to 360, so 263.1159 becomes -96.8841.
export function wrapLonDeg(lonDeg: number): number {
  // The remainder is between -360 and 360.
  let lon = lonDeg % 360;
  if (lon >= 180) {
    lon -= 360;
  }
  if (lon < -180) {
    lon += 360;
  }
  return lon;
}

// Where a point goes on a map that is width wide and height tall.
// lonDeg must already be between -180 and 180: use wrapLonDeg first.
// x runs from 0 at longitude -180 to width at longitude 180.
// y runs from 0 at latitude 90 down to height at latitude -90.
export function lonLatToXY(
  lonDeg: number,
  latDeg: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: ((lonDeg + 180) / 360) * width,
    y: ((90 - latDeg) / 180) * height,
  };
}

// The latitude of the terminator at one longitude: the place on that
// longitude where the Sun sits exactly on a smooth horizon.
//
// subSolarLatDeg and subSolarLonDeg are the sub-solar point, where the Sun is
// straight overhead. The terminator is every point 90 degrees away from it.
//
// When the sub-solar latitude is exactly 0 the terminator runs straight from
// pole to pole, so a longitude is either all day or all night. The answer is
// then -90 on the day side and 90 on the night side.
export function terminatorLatDeg(
  lonDeg: number,
  subSolarLatDeg: number,
  subSolarLonDeg: number,
): number {
  const subLat = toRadians(subSolarLatDeg);
  const lonDifference = toRadians(lonDeg - subSolarLonDeg);

  // A point is 90 degrees from the sub-solar point when
  //   sin(lat) sin(subLat) + cos(lat) cos(subLat) cos(lonDifference) = 0
  // Dividing by cos(lat) and moving things around gives
  //   tan(lat) = -cos(subLat) cos(lonDifference) / sin(subLat)
  let top = -Math.cos(subLat) * Math.cos(lonDifference);
  let bottom = Math.sin(subLat);

  // Math.atan2(top, bottom) is the angle whose tangent is top / bottom, worked
  // out without dividing, so a bottom of 0 gives 90 or -90 and not an error.
  // It only stays between -90 and 90 when bottom is not negative, so flip
  // both signs when it is. The fraction top / bottom stays the same.
  if (bottom < 0) {
    top = -top;
    bottom = -bottom;
  }
  return toDegrees(Math.atan2(top, bottom));
}

// The latitude of the pole that is in the dark: -90 (south) when the Sun is
// over the northern half of the Moon or the equator, 90 (north) when it is
// over the southern half.
export function darkPoleLatDeg(subSolarLatDeg: number): number {
  if (subSolarLatDeg < 0) {
    return 90;
  }
  return -90;
}

// An SVG path around the night half of the Moon, on a map that is width wide
// and height tall. It starts in the corner at the dark pole, follows the
// terminator from the left edge to the right edge, and closes back along the
// dark pole's edge. Everything between the terminator and the dark pole is
// night.
export function nightPath(
  subSolarLatDeg: number,
  subSolarLonDeg: number,
  width: number,
  height: number,
): string {
  const darkPoleLat = darkPoleLatDeg(subSolarLatDeg);

  const start = lonLatToXY(-180, darkPoleLat, width, height);
  const parts: string[] = ["M" + roundTo2(start.x) + "," + roundTo2(start.y)];

  for (let lon = -180; lon <= 180; lon += TERMINATOR_STEP_DEG) {
    const lat = terminatorLatDeg(lon, subSolarLatDeg, subSolarLonDeg);
    const point = lonLatToXY(lon, lat, width, height);
    parts.push("L" + roundTo2(point.x) + "," + roundTo2(point.y));
  }

  const end = lonLatToXY(180, darkPoleLat, width, height);
  parts.push("L" + roundTo2(end.x) + "," + roundTo2(end.y));
  parts.push("Z");
  return parts.join(" ");
}

// The short name written next to a dot on the whole Moon map.
// A landing is named up to its first comma: "Apollo 11, Mare Tranquillitatis"
// gives "Apollo 11". A custom point keeps only its numbers:
// "Custom 12.00, 34.00" gives "12.00, 34.00".
export function dotLabel(name: string, isCustom: boolean): string {
  if (isCustom) {
    const prefix = "Custom ";
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
    return name;
  }

  const commaIndex = name.indexOf(",");
  if (commaIndex === -1) {
    return name;
  }
  return name.slice(0, commaIndex);
}
