import type { Hourly, SiteRow } from "@/lib/app-types";
import { clearanceSeries, countdownText } from "@/lib/clearance";
import { sunPercent } from "@/lib/data";
import { daysOfMonth, shortSiteName } from "@/lib/grid";
import {
  firstDayOfMonth,
  firstMonthOfYear,
  formatHour,
  monthName,
  monthOfHour,
} from "@/lib/time";
import { monthVerdict } from "@/lib/verdict";

// The days of 2027 to 2030, the years sun_pct_10m in sites.json covers.
const DAYS_2027_TO_2030 = firstDayOfMonth(firstMonthOfYear(2031));

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

  // The month on screen in a sentence, led by the site name: how much Sun and
  // Earth, and which of the two is the limit.
  const month = monthOfHour(selectedHour);
  const monthDays = [];
  for (const dayOfYear of daysOfMonth(month)) {
    if (row.days[dayOfYear] !== undefined) {
      monthDays.push(row.days[dayOfYear]);
    }
  }
  const verdict = monthVerdict(shortSiteName(site.name), monthDays, monthName(month));

  // How far the Sun and Earth sit above the terrain horizon this hour, the
  // same number the clearance charts draw. Above 0 means in view.
  let sunClearance = 0;
  let earthClearance = 0;
  if (hourly !== null) {
    sunClearance = clearanceSeries(hourly, "sun", selectedHour, selectedHour + 1)[0];
    earthClearance = clearanceSeries(hourly, "earth", selectedHour, selectedHour + 1)[0];
  }

  // What the two big numbers are measured from: the terrain, or a flat
  // horizon for a site with no terrain.
  const aboveWhat = row.isReference || row.isCustom ? "above horizon" : "above terrain";

  return (
    // The verdict first, then where and when, then the Sun and the Earth,
    // each with its height above the terrain, raw elevation and countdown.
    // Below lg this box dissolves ("contents") so the page can put the sky
    // between the verdict and the numbers.
    <div className="flex flex-col gap-3 text-sm max-lg:contents">
      {verdict !== "" && (
        <p className="text-xl leading-snug text-bright lg:text-base">{verdict}</p>
      )}

      <div className="text-xs">
        {/* The verdict names the site, so a site with no days still needs its name here. */}
        {verdict === "" && <p className="text-sm text-bright">{shortSiteName(site.name)}</p>}
        <p className="font-mono tabular-nums text-muted-foreground">
          {site.mission !== undefined && (
            <span className="mr-2 rounded-sm bg-bright px-1.5 font-sans text-xs font-medium text-background">
              {site.mission}
            </span>
          )}
          {site.lat.toFixed(4)}°, {site.lon.toFixed(4)}° · {formatHour(selectedHour)}
        </p>
        {(row.isReference || row.isCustom) && (
          <p className="text-muted-foreground">Smooth Moon, no terrain.</p>
        )}
        {site.note !== undefined && (
          <p className="mt-1 text-muted-foreground">{site.note}</p>
        )}
        {/* Facts that do not change with the hour, from optional fields of
            sites.json, in one paragraph to keep the card short. row.days
            holds every day of 2027 to 2040, worked out from 2 m up. sun_pct_10m
            only covers 2027 to 2030, so the 2 m figure uses those days too. */}
        {(site.sun_pct_10m !== undefined ||
          site.slope_deg !== undefined ||
          site.psr_km !== undefined) && (
          <p className="text-muted-foreground">
            {site.sun_pct_10m !== undefined && (
              <>
                Sun 2027 to 2030: {sunPercent(row.days.slice(0, DAYS_2027_TO_2030)).toFixed(1)}% at 2 m,{" "}
                {site.sun_pct_10m.toFixed(1)}% at 10 m.{" "}
              </>
            )}
            {site.slope_deg !== undefined && <>Slope {site.slope_deg.toFixed(1)}°. </>}
            {/* psr_km is measured to the edge of the nearest permanently
                shadowed region of at least 1 km2, and is 0 inside one. Smaller
                shadows can be much closer, so the size is always named. */}
            {site.psr_km !== undefined && site.psr_km > 0 && (
              <>Nearest permanent shadow of 1 km² or more: {site.psr_km.toFixed(1)} km.</>
            )}
            {site.psr_km === 0 && <>Inside a permanent shadow of 1 km² or more.</>}
          </p>
        )}
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
        <div className="grid grid-cols-2 gap-x-4 max-lg:order-2">
          <div>
            <p className="text-muted-foreground">Sun {aboveWhat}</p>
            <p className="font-mono text-2xl leading-tight tabular-nums text-power">
              {sunClearance.toFixed(2)}°
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              Sun elev. {hourly.sun_elev_deg[selectedHour].toFixed(2)}°
            </p>
            <p className="text-sm tabular-nums text-foreground">
              {countdownText(hourly.sun_visible, selectedHour, "Sunset", "Sunrise")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Earth {aboveWhat}</p>
            <p className="font-mono text-2xl leading-tight tabular-nums text-comms">
              {earthClearance.toFixed(2)}°
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              Earth elev. {hourly.earth_elev_deg[selectedHour].toFixed(2)}°
            </p>
            <p className="text-sm tabular-nums text-foreground">
              {countdownText(hourly.earth_visible, selectedHour, "Earthset", "Earthrise")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
