import type { Hourly, SiteRow } from "@/lib/app-types";
import { countdownText } from "@/lib/clearance";
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

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        {/* A custom point is named by its numbers, which use the mono font. */}
        <p className={row.isCustom ? "font-mono tabular-nums text-bright" : "text-bright"}>
          {site.name}
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
        <>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-muted-foreground">Sun elevation</p>
              <p className="font-mono text-4xl tabular-nums text-power">
                {hourly.sun_elev_deg[selectedHour].toFixed(2)}°
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Earth elevation</p>
              <p className="font-mono text-xl tabular-nums text-comms">
                {hourly.earth_elev_deg[selectedHour].toFixed(2)}°
              </p>
            </div>
          </div>

          <div className="font-mono tabular-nums text-foreground">
            <p>
              {countdownText(hourly.sun_visible, selectedHour, "Sunset", "Sunrise")}
            </p>
            <p>
              {countdownText(hourly.earth_visible, selectedHour, "Earthset", "Earthrise")}
            </p>
          </div>

          {row.isCustom && (
            <p className="text-muted-foreground">Flat horizon, no terrain.</p>
          )}
        </>
      )}
    </div>
  );
}
