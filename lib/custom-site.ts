// Sun and Earth angles for a custom point on the Moon, worked out in the
// browser from ephemeris.json. There is no terrain here: the horizon is flat,
// so a body counts as visible when its centre is above 0 degrees.

import type { DaySummary } from "./data.ts";

const MOON_RADIUS_KM = 1737.4;

// One astronomical unit. The Sun is so far away that its real distance on a
// given day changes the answer by far less than 0.001 degrees.
const SUN_DISTANCE_KM = 149_597_870.7;

const HOURS_PER_DAY = 24;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The parts of ephemeris.json these helpers need.
export type SubPoints = {
  sub_solar_lon_deg: number[];
  sub_solar_lat_deg: number[];
  sub_earth_lon_deg: number[];
  sub_earth_lat_deg: number[];
  earth_distance_km: number[];
};

// The hourly arrays of a custom point. Same names as in sites/<id>.json.
export type CustomHourly = {
  sun_elev_deg: number[];
  earth_elev_deg: number[];
  sun_visible: number[];
  earth_visible: number[];
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// Elevation of a body (the Sun or Earth) above a flat horizon, in degrees,
// seen from the point (latDeg, lonDeg) on the Moon.
//
// subLatDeg and subLonDeg are the sub point: the place on the Moon where the
// body is straight overhead. distanceKm is from the Moon's centre to the body.
// The distance matters for Earth: it is close enough that moving across the
// Moon shifts it in the sky by up to about 0.26 degrees.
export function elevationDeg(
  latDeg: number,
  lonDeg: number,
  subLatDeg: number,
  subLonDeg: number,
  distanceKm: number,
): number {
  const lat = toRadians(latDeg);
  const subLat = toRadians(subLatDeg);
  const lonDifference = toRadians(lonDeg - subLonDeg);

  // Cosine of the angle between the point and the sub point, measured at the
  // Moon's centre (spherical law of cosines).
  const cosAngle =
    Math.sin(lat) * Math.sin(subLat) +
    Math.cos(lat) * Math.cos(subLat) * Math.cos(lonDifference);

  // Math.max guards against a rounding error making this the root of a tiny
  // negative number.
  const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle));

  // Split the line from the point to the body into two parts:
  // heightKm is how far the body is above the point's horizon plane,
  // acrossKm is how far away it is along that plane.
  const heightKm = distanceKm * cosAngle - MOON_RADIUS_KM;
  const acrossKm = distanceKm * sinAngle;

  return toDegrees(Math.atan2(heightKm, acrossKm));
}

// Sun and Earth elevation for every hour in the ephemeris, at one custom
// point, plus 1 or 0 flags for "above the flat horizon".
export function customSiteHourly(
  latDeg: number,
  lonDeg: number,
  subPoints: SubPoints,
): CustomHourly {
  const hourly: CustomHourly = {
    sun_elev_deg: [],
    earth_elev_deg: [],
    sun_visible: [],
    earth_visible: [],
  };

  for (let i = 0; i < subPoints.sub_solar_lon_deg.length; i++) {
    const sunElevation = elevationDeg(
      latDeg,
      lonDeg,
      subPoints.sub_solar_lat_deg[i],
      subPoints.sub_solar_lon_deg[i],
      SUN_DISTANCE_KM,
    );
    const earthElevation = elevationDeg(
      latDeg,
      lonDeg,
      subPoints.sub_earth_lat_deg[i],
      subPoints.sub_earth_lon_deg[i],
      subPoints.earth_distance_km[i],
    );

    hourly.sun_elev_deg.push(roundTo3(sunElevation));
    hourly.earth_elev_deg.push(roundTo3(earthElevation));
    hourly.sun_visible.push(sunElevation > 0 ? 1 : 0);
    hourly.earth_visible.push(earthElevation > 0 ? 1 : 0);
  }

  return hourly;
}

// Per-day totals from hourly arrays, the same numbers data/build.py puts in
// summary/<id>.json. It assumes one sample per hour, so a day is 24 samples.
// startUtc is the time of sample 0, for example "2027-01-01T00:00:00Z".
// Samples left over after the last whole day are ignored.
export function summarizeDays(
  startUtc: string,
  sunElevDeg: number[],
  sunVisible: number[],
  earthVisible: number[],
): DaySummary[] {
  const startMs = Date.parse(startUtc);
  const dayCount = Math.floor(sunElevDeg.length / HOURS_PER_DAY);
  const days: DaySummary[] = [];

  for (let day = 0; day < dayCount; day++) {
    const firstHour = day * HOURS_PER_DAY;
    let sunHours = 0;
    let earthHours = 0;
    let maxSunElevation = -Infinity;
    let currentGap = 0;
    let longestGap = 0;

    for (let i = firstHour; i < firstHour + HOURS_PER_DAY; i++) {
      sunHours += sunVisible[i];
      earthHours += earthVisible[i];
      maxSunElevation = Math.max(maxSunElevation, sunElevDeg[i]);

      // A gap is a run of hours in a row without the Sun.
      if (sunVisible[i] === 1) {
        currentGap = 0;
      } else {
        currentGap += 1;
      }
      longestGap = Math.max(longestGap, currentGap);
    }

    // "2027-01-01T00:00:00.000Z" cut down to "2027-01-01".
    const date = new Date(startMs + day * MS_PER_DAY).toISOString().slice(0, 10);

    days.push({
      date: date,
      sun_hours: sunHours,
      earth_hours: earthHours,
      max_sun_elev_deg: maxSunElevation,
      longest_sun_gap_hours: longestGap,
    });
  }

  return days;
}
