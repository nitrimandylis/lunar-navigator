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
- Sort by power (Sun hours) or comms (Earth hours) for the month on screen.
- Clearance charts: how far the Sun and Earth sit above the terrain horizon, every hour of
  the month, with the selected hour marked.
- Selected-site numbers: Sun and Earth elevation, and countdowns to sunset or sunrise and to
  Earthset or Earthrise.
- South pole map with ten crater outlines, site pins and two near pairs (near Shackleton,
  3.5 km apart, and near Sverdrup, 2.5 km apart, each a lit and a shadowed site). Click empty
  ground to pick a custom point.
- Custom points: up to 3, latitude -90 to -80, with a flat horizon and no terrain. They are
  listed apart from the curated sites, under their own divider, and never ranked against
  them, because a flat horizon near the pole gives far too many Sun hours.

Still open:

- Sort by hours with both Sun and Earth in view. Waiting on a `both_hours` field in the data.
- Terrain for custom points. Judged not possible before the deadline.
