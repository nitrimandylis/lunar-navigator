// Shapes of the JSON files that the Python in data/ writes, plus two small
// helpers that work on them. Field names match the JSON exactly (snake_case),
// so parsed JSON can be typed without any conversion.

// One entry of sites.json.
export type Site = {
  id: string;
  name: string;
  lat: number;
  // East-positive degrees.
  lon: number;
  elevation_m: number;
  source: string;
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
};

// Adds up the hours of sunlight and of Earth visibility for each month.
// Returns 12 entries, January first. A month with no days gives zeros.
export function totalsByMonth(days: DaySummary[]): MonthTotals[] {
  const totals: MonthTotals[] = [];
  for (let month = 0; month < 12; month++) {
    totals.push({ sunHours: 0, earthHours: 0 });
  }

  for (const day of days) {
    // In "2027-03-15" the characters at positions 5 and 6 are the month, "03".
    const monthNumber = Number(day.date.slice(5, 7));
    const monthTotals = totals[monthNumber - 1];
    monthTotals.sunHours += day.sun_hours;
    monthTotals.earthHours += day.earth_hours;
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
