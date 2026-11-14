# lunar-navigator

## What it is

A web tool for mission planners (and readable by educators and the public) to compare
south pole landing sites and dates: hours of Sun (power) and Earth (comms) at each site,
with terrain horizons, from JPL Horizons ephemerides and LOLA terrain.

## Where it is headed

Hackathon build, 14-15 Nov 2026. South pole only, calendar year 2027, hourly, UTC.

Built now:

- Sites grid: one row per site, two lanes per day (orange power, blue comms), one month at
  a time. Click a day to open its 24 hours; Escape or the close button shuts it.
- Month chips in the header, tinted by the selected site's monthly hours.
- Sort by power (Sun hours), comms (Earth hours) or both at once, for the month on screen.
- Real mission targets (IM-2, Artemis III candidate regions) next to computed candidates,
  marked with a mission tag.
- Sky panorama: the terrain horizon all the way round the selected site (north, east,
  south, west, north), with the Sun and Earth at their real direction and height for the
  selected hour, and the paths they take during the month. A body hidden by terrain is
  drawn hollow.
- Time controls: a play button runs time forward (about a lunar day per minute), a slider
  scrubs through the month, and the left and right arrow keys step one hour. The grid, the
  panorama, the charts and the countdowns all follow the same hour.
- Clearance charts: how far the Sun and Earth sit above the terrain horizon, every hour of
  the month, with the selected hour marked.
- Selected-site numbers beside the charts: Sun and Earth height above the terrain (raw
  elevation underneath), and countdowns to sunset or sunrise and to
  Earthset or Earthrise.
- South pole map out to -82, with ten crater outlines, site pins (mission targets ringed)
  and two near pairs (near Shackleton, 2.1 km apart, and near Sverdrup, 2.5 km apart, each a
  lit and a shadowed site). Click empty ground to pick a custom point.
- Past landings for comparison: Apollo 11, Blue Ghost 1 (CLPS), SLIM, Chandrayaan-3 and
  Chang'e 6 (far side), with coordinates from the NASA NSSDCA table. They are worked out in
  the browser on a smooth Moon with no terrain, listed under their own divider, and never
  ranked against the polar sites.
- Custom points: up to 3, anywhere on the Moon by typing (map clicks stay inside the polar
  map), with a flat horizon and no terrain. They are listed apart from the curated sites,
  under their own divider, and never ranked against them, because a flat horizon near the
  pole gives far too many Sun hours.

Still open:

- Terrain for custom points. Judged not possible before the deadline.
- A LOLA hillshade under the map, if gio has time.
