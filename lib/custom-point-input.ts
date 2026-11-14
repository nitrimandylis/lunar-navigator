// Checks the latitude and longitude a user typed for a custom point.

// A custom point can be anywhere on the Moon.
export const MIN_LAT = -90;
export const MAX_LAT = 90;

// Longitude is east-positive. Both -180 to 180 and 0 to 360 are common, so
// accept either.
export const MIN_LON = -180;
export const MAX_LON = 360;

// Either the two numbers, or one short message saying what is wrong.
export type CustomPointResult =
  | { ok: true; lat: number; lon: number }
  | { ok: false; message: string };

// A plain decimal number: an optional sign, then digits with an optional
// decimal point, like "-85", "116.84", "+3." or "-.5". Nothing else is allowed,
// so "abc", "Infinity", "1e3", "0x10" and "-85abc" are all rejected.
const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;

// Turns one field's text into a number, or null if it is not a plain number.
function parseDecimal(text: string): number | null {
  if (!DECIMAL_PATTERN.test(text)) {
    return null;
  }
  return Number(text);
}

export function validateCustomPoint(latText: string, lonText: string): CustomPointResult {
  // Spaces around the number are fine, for example from copy and paste.
  const latTrimmed = latText.trim();
  const lonTrimmed = lonText.trim();

  if (latTrimmed === "" || lonTrimmed === "") {
    return { ok: false, message: "Enter both a latitude and a longitude." };
  }

  const lat = parseDecimal(latTrimmed);
  if (lat === null) {
    return { ok: false, message: "Latitude must be a number, like -89.33." };
  }
  const lon = parseDecimal(lonTrimmed);
  if (lon === null) {
    return { ok: false, message: "Longitude must be a number, like 116.84." };
  }

  if (lat < MIN_LAT || lat > MAX_LAT) {
    return { ok: false, message: "Latitude must be from -90 to 90." };
  }
  if (lon < MIN_LON || lon > MAX_LON) {
    return { ok: false, message: "Longitude must be from -180 to 360." };
  }

  return { ok: true, lat: lat, lon: lon };
}
