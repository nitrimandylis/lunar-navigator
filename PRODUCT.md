# lunar-navigator

## What it is

A web tool for mission planners (and readable by educators and the public) to compare
south pole landing sites and dates: hours of Sun (power) and Earth (comms) at each site,
with terrain horizons, from JPL Horizons ephemerides and LOLA terrain.

## Where it is headed

Hackathon build, 14-15 Nov 2026. Decisions made on 14 Nov 2026:

- Sites: south pole only. The curated list comes from gio's data, including near pairs
  (a crater site and a computed rim candidate beside it) that get a "pair" tag.
- Custom points: latitude -90 to -80, up to 3, not saved. Sun and Earth angles are computed
  in the browser from precomputed sub-solar and sub-Earth points, with a flat horizon, and
  shown with a "no terrain" badge.
- Data: calendar year 2027, hourly, UTC. JSON lives in `public/data/`. Per-day summaries
  load at start, a site's hourly file loads on demand.
- Main view: site-by-day grid, two lanes per site, one month at a time. 12 month chips
  tinted by the selected site's monthly hours. Click a day to open its 24 hours.
- Selection: a site plus an hour. The selected-site panel shows solar elevation, time to
  sunset or sunrise, and time to Earthset or Earthrise.
- Detail: Sun and Earth clearance charts under the grid. Small south pole locator map.
  No 3D, no panorama.
- Rendering: plain CSS and SVG first. A chart library only if that falls short.
- Build order: theme and shell, pure helpers with tests, lanes grid, clearance charts and
  site numbers, locator map, custom sites, legend and polish.
