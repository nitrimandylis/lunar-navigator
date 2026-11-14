import type { Hourly, SiteRow } from "@/lib/app-types";
import { clearanceSeries, countdownText } from "@/lib/clearance";
import { shortSiteName } from "@/lib/grid";
import { formatHour } from "@/lib/time";

export type SelectedSiteProps = {
  // The selected site, or null when nothing is selected.
  row: SiteRow | null;
  // The selected site's hourly data, or null while it is still loading.
  hourly: Hourly | null;
  // True when the selected site's hourly file failed to load.
  hourlyFailed: boolean;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
};

// Numbers for the selected site and hour.
export function SelectedSite({ row, hourly, hourlyFailed, selectedHour }: SelectedSiteProps) {
  if (row === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No site selected. Solar elevation, time to sunset and time to Earthset
        will show here.
      </p>
    );
  }

  const site = row.site;

  // How far the Sun and Earth sit above the terrain horizon this hour, the
  // same number the clearance charts draw. Above 0 means in view.
  let sunClearance = 0;
  let earthClearance = 0;
  if (hourly !== null) {
    sunClearance = clearanceSeries(hourly, "sun", selectedHour, selectedHour + 1)[0];
    earthClearance = clearanceSeries(hourly, "earth", selectedHour, selectedHour + 1)[0];
  }

  return (
    // The site, then the Sun and the Earth, each with its height above the
    // terrain, raw elevation and countdown.
    <div className="flex flex-col gap-3 text-sm">
      <div>
        {/* A custom point is named by its numbers, which use the mono font. */}
        <p className={row.isCustom ? "font-mono tabular-nums text-bright" : "text-bright"}>
          {shortSiteName(site.name)}
          {site.mission !== undefined && (
            <span className="ml-2 rounded-sm bg-bright px-1.5 align-middle text-[11px] font-medium text-background">
              {site.mission}
            </span>
          )}
        </p>
        <p className="font-mono tabular-nums text-muted-foreground">
          {site.lat.toFixed(4)}°, {site.lon.toFixed(4)}°
        </p>
        <p className="font-mono tabular-nums text-muted-foreground">
          {formatHour(selectedHour)}
        </p>
      </div>

      {hourly === null && !hourlyFailed && (
        <p className="text-muted-foreground">Loading hourly data.</p>
      )}
      {hourly === null && hourlyFailed && (
        <p className="text-bright">
          Could not load this site&apos;s hourly data. Select the site again to retry.
        </p>
      )}

      {hourly !== null && (
        // Sun and Earth side by side: height above the terrain, raw
        // elevation, and the countdown to the next change.
        <div className="grid grid-cols-2 gap-x-4">
          <p className="col-span-2 text-muted-foreground">Above terrain</p>
          <div>
            <p className="font-mono text-2xl leading-tight tabular-nums text-power">
              {sunClearance.toFixed(2)}°
            </p>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              Sun elev. {hourly.sun_elev_deg[selectedHour].toFixed(2)}°
            </p>
            <p className="font-mono text-[13px] tabular-nums text-foreground">
              {countdownText(hourly.sun_visible, selectedHour, "Sunset", "Sunrise")}
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl leading-tight tabular-nums text-comms">
              {earthClearance.toFixed(2)}°
            </p>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              Earth elev. {hourly.earth_elev_deg[selectedHour].toFixed(2)}°
            </p>
            <p className="font-mono text-[13px] tabular-nums text-foreground">
              {countdownText(hourly.earth_visible, selectedHour, "Earthset", "Earthrise")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
