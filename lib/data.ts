// Shapes of the JSON files that the Python in data/ writes, plus small
// helpers that work on them. Field names match the JSON exactly (snake_case),
// so parsed JSON can be typed without any conversion.

import { FIRST_YEAR, MONTH_COUNT, firstMonthOfYear } from "./time.ts";

// One entry of sites.json.
export type Site = {
  id: string;
  name: string;
  lat: number;
  // East-positive degrees.
  lon: number;
  elevation_m: number;
  source: string;
  // Only on real mission targets, for example "IM-2" or "Artemis III candidate".
  // Computed candidates leave it out.
  mission?: string;
};

// sites/<id>.json: one value per hour for one site.
// Index i in every hourly array is the hour start_utc + i * step_minutes.
export type SiteHourly = {
  id: string;
  start_utc: string;
  step_minutes: number;
  count: number;
  sun_elev_deg: number[];
  sun_az_deg: number[];
  earth_elev_deg: number[];
  earth_az_deg: number[];
  // 1 = above the terrain horizon, 0 = below it.
  sun_visible: number[];
  earth_visible: number[];
  // The terrain horizon around the site: one height angle per azimuth step.
  horizon: {
    az_step_deg: number;
    elev_deg: number[];
  };
};

// One day of summary/<id>.json.
export type DaySummary = {
  // "2027-01-01"
  date: string;
  sun_hours: number;
  earth_hours: number;
  // Hours with the Sun and Earth both in view.
  both_hours: number;
  max_sun_elev_deg: number;
  longest_sun_gap_hours: number;
};

// summary/<id>.json: per-day totals for one site.
export type SiteSummary = {
  id: string;
  days: DaySummary[];
};

// ephemeris.json: the same for every site, one value per hour.
// The sub-solar point is the place on the Moon where the Sun is straight
// overhead. The sub-Earth point is the same idea for Earth.
export type Ephemeris = {
  start_utc: string;
  step_minutes: number;
  count: number;
  sub_solar_lon_deg: number[];
  sub_solar_lat_deg: number[];
  sub_earth_lon_deg: number[];
  sub_earth_lat_deg: number[];
  earth_distance_km: number[];
};

export type MonthTotals = {
  sunHours: number;
  earthHours: number;
  bothHours: number;
};

// Where a year's files live. 2027 sits directly in /data/. Each later year
// has its own folder: /data/2028/, /data/2029/, /data/2030/.
export function dataFolder(year: number): string {
  if (year === FIRST_YEAR) {
    return "/data/";
  }
  return "/data/" + year + "/";
}

// Joins one site's hourly files, one per year and in year order, into one
// file that covers all the years. The terrain horizon does not change from
// year to year, so it comes from the first file.
export function joinHourly(parts: SiteHourly[]): SiteHourly {
  const joined: SiteHourly = {
    id: parts[0].id,
    start_utc: parts[0].start_utc,
    step_minutes: parts[0].step_minutes,
    count: 0,
    sun_elev_deg: [],
    sun_az_deg: [],
    earth_elev_deg: [],
    earth_az_deg: [],
    sun_visible: [],
    earth_visible: [],
    horizon: parts[0].horizon,
  };
  for (const part of parts) {
    joined.count += part.count;
    joined.sun_elev_deg = joined.sun_elev_deg.concat(part.sun_elev_deg);
    joined.sun_az_deg = joined.sun_az_deg.concat(part.sun_az_deg);
    joined.earth_elev_deg = joined.earth_elev_deg.concat(part.earth_elev_deg);
    joined.earth_az_deg = joined.earth_az_deg.concat(part.earth_az_deg);
    joined.sun_visible = joined.sun_visible.concat(part.sun_visible);
    joined.earth_visible = joined.earth_visible.concat(part.earth_visible);
  }
  return joined;
}

// Joins the ephemeris files, one per year and in year order, into one.
export function joinEphemeris(parts: Ephemeris[]): Ephemeris {
  const joined: Ephemeris = {
    start_utc: parts[0].start_utc,
    step_minutes: parts[0].step_minutes,
    count: 0,
    sub_solar_lon_deg: [],
    sub_solar_lat_deg: [],
    sub_earth_lon_deg: [],
    sub_earth_lat_deg: [],
    earth_distance_km: [],
  };
  for (const part of parts) {
    joined.count += part.count;
    joined.sub_solar_lon_deg = joined.sub_solar_lon_deg.concat(part.sub_solar_lon_deg);
    joined.sub_solar_lat_deg = joined.sub_solar_lat_deg.concat(part.sub_solar_lat_deg);
    joined.sub_earth_lon_deg = joined.sub_earth_lon_deg.concat(part.sub_earth_lon_deg);
    joined.sub_earth_lat_deg = joined.sub_earth_lat_deg.concat(part.sub_earth_lat_deg);
    joined.earth_distance_km = joined.earth_distance_km.concat(part.earth_distance_km);
  }
  return joined;
}

// Adds up the hours of sunlight, of Earth visibility and of both for each month.
// Returns one entry per month index, January 2027 first (see lib/time.ts).
// A month with no days gives zeros. A day outside the years with data is ignored.
export function totalsByMonth(days: DaySummary[]): MonthTotals[] {
  const totals: MonthTotals[] = [];
  for (let month = 0; month < MONTH_COUNT; month++) {
    totals.push({ sunHours: 0, earthHours: 0, bothHours: 0 });
  }

  for (const day of days) {
    // In "2027-03-15" the first 4 characters are the year, and the
    // characters at positions 5 and 6 are the month, "03".
    const year = Number(day.date.slice(0, 4));
    const monthNumber = Number(day.date.slice(5, 7));
    const month = firstMonthOfYear(year) + monthNumber - 1;
    if (month < 0 || month >= MONTH_COUNT) {
      continue;
    }
    const monthTotals = totals[month];
    monthTotals.sunHours += day.sun_hours;
    monthTotals.earthHours += day.earth_hours;
    monthTotals.bothHours += day.both_hours;
  }

  return totals;
}

// How many hours after fromIndex the value first differs from
// visible[fromIndex]. If the Sun is up at fromIndex this is the hours until
// sunset. If it is down, the hours until sunrise.
//
// visible is a sun_visible or earth_visible array (1 or 0 per hour). The
// answer counts array steps, which are hours because the files use 60 minute
// steps.
//
// Returns null if the value never changes before the array ends. Also returns
// null if fromIndex is not a whole number inside the array, because then there
// is no starting value to compare against.
export function hoursUntilChange(
  visible: number[],
  fromIndex: number,
): number | null {
  if (!Number.isInteger(fromIndex)) {
    return null;
  }
  if (fromIndex < 0 || fromIndex >= visible.length) {
    return null;
  }

  const startValue = visible[fromIndex];
  for (let i = fromIndex + 1; i < visible.length; i++) {
    if (visible[i] !== startValue) {
      return i - fromIndex;
    }
  }
  return null;
}
