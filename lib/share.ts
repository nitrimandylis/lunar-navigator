// Share links and CSV export: ways to take what is on screen somewhere else.

import type { Hourly } from "./app-types.ts";
import { hourToIso, isoToHour } from "./time.ts";
import { MISSION_PRESETS } from "./windows.ts";

// What a share link carries: the selected site and hour. A part that is
// missing or not valid is null, and the page keeps its usual start for it.
// planPresetId says the link opens the mission planner on that preset. It is
// null when the link has no plan part.
export type SharedView = {
  siteId: string | null;
  hour: number | null;
  planPresetId: string | null;
};

// The query part of a share link, for example
// "?site=shackleton-ridge&time=2027-05-16T00:00Z".
export function shareQuery(siteId: string, hour: number): string {
  return "?site=" + encodeURIComponent(siteId) + "&time=" + hourToIso(hour);
}

// Reads a share link's query (window.location.search). knownSiteIds are the
// sites that exist: any other site id is ignored.
export function parseShareQuery(query: string, knownSiteIds: string[]): SharedView {
  const params = new URLSearchParams(query);

  let siteId: string | null = params.get("site");
  if (siteId !== null && !knownSiteIds.includes(siteId)) {
    siteId = null;
  }

  let hour: number | null = null;
  const timeText = params.get("time");
  if (timeText !== null) {
    hour = isoToHour(timeText);
  }

  // "?plan=rover" opens the planner on that preset. "?plan=1" or any value
  // that is not a preset id opens it on the first preset.
  let planPresetId: string | null = null;
  const planText = params.get("plan");
  if (planText !== null) {
    planPresetId = MISSION_PRESETS[0].id;
    for (const preset of MISSION_PRESETS) {
      if (preset.id === planText) {
        planPresetId = preset.id;
      }
    }
  }

  return { siteId: siteId, hour: hour, planPresetId: planPresetId };
}

const CSV_HEADER =
  "time_utc,sun_elev_deg,sun_az_deg,earth_elev_deg,earth_az_deg,sun_visible,earth_visible";

// A site's hourly data as CSV text: one header line, then one line per hour.
// Angles are degrees, as in the data files. The visible columns are 1 or 0.
export function hourlyCsv(hourly: Hourly): string {
  const lines: string[] = [CSV_HEADER];
  for (let hour = 0; hour < hourly.sun_visible.length; hour++) {
    const values = [
      hourToIso(hour),
      hourly.sun_elev_deg[hour],
      hourly.sun_az_deg[hour],
      hourly.earth_elev_deg[hour],
      hourly.earth_az_deg[hour],
      hourly.sun_visible[hour],
      hourly.earth_visible[hour],
    ];
    lines.push(values.join(","));
  }
  return lines.join("\n") + "\n";
}
