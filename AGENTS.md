# Team rules (every agent reads this)

Lunar Landing Site Navigator, NASA Space Apps 2026 (Athens). Team: trim, gio, koum.
Trim and gio use Claude Code. Koum uses Codex (ChatGPT) on Windows.

## The challenge

Brief: https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/
Read it before planning a feature. In short: let mission planners, educators and the public
compare lunar landing sites and dates quickly, showing Sun and Earth against the horizon
(power and direct-to-Earth comms). It suggests:

- Curated sites (Apollo, CLPS targets, other commercial and national missions) plus custom
  lat/lon, compared side by side.
- Date/time picking, and how conditions change across lunar days and seasons.
- Solar elevation, sunlight duration, Earth visibility windows, and time left before
  sunset and Earthset.
- Terrain horizons from LOLA topography (no atmosphere, so no refraction). Libration matters.

Named resources: JPL Horizons (https://ssd.jpl.nasa.gov/horizons/), LROC Quickmap
(https://quickmap.lroc.asu.edu/), Moon Trek (https://trek.nasa.gov/moon/), LOLA (named only,
no link), CSA Moon Exploration (background).

## Folder ownership

Only edit files inside folders your human owns.

| Name | GitHub login  | Owns                                   |
|------|---------------|----------------------------------------|
| trim | nitrimandylis | everything not listed below            |
| gio  | supergioo0    | `data/` (Python precompute), `public/data/` (JSON out) |
| koum | FILL_IN       | `story/` (slides, video script, sources) |

Nobody's agent edits `.github/` or `CLAUDE.md`. Trim changes those by hand.

Any agent may edit `AGENTS.md` to keep it true: record a contract change both owners agreed,
or fix a fact that went stale. Put the edit in the PR for the change it describes.

## Stack

- Next.js (App Router), TypeScript, Tailwind, shadcn/ui. Package manager: npm (`npm install`, `npm run dev`). Commit `package-lock.json`, no other lockfile.
- `data/` is Python. It writes JSON to `public/data/`, which the app reads. The app never calls Python at runtime.
- `story/` is Markdown only: no code.

## Contract

The data shapes passed between folders. Change only when both owners agree.

`data/build.py` writes the files below to `public/data/`. The app fetches them from `/data/...`.
They cover calendar years 2027 to 2030, one sample per hour.

- 2027 lives at `/data/sites/<id>.json`, `/data/summary/<id>.json`, `/data/ephemeris.json`.
- Other years live at `/data/<year>/sites/<id>.json`, `/data/<year>/summary/<id>.json`,
  `/data/<year>/ephemeris.json`. There is one `sites.json` for all years.
- `start_utc` is `<year>-01-01T00:00:00Z`. A year has 8760 hours and 365 days, a leap year
  (2028) 8784 and 366. Never hardcode them: read `count` and `days.length`.
- The examples below show 2027.

Conventions:

- Times are UTC, ISO 8601 (`2027-01-01T00:00:00Z`).
- Angles are degrees. Longitude is east-positive.
- Elevation is the angle above a smooth Moon (flat horizon = 0). Azimuth is clockwise from
  north, 0 to 360.
- Hourly series are plain arrays. Index `i` in every array is the hour
  `start_utc + i * step_minutes`.
- The Sun and Earth are treated as discs, not points. A body is visible at an hour when any
  part of its disc is above the terrain horizon. Sun radius: 0.2664 degrees. Earth radius:
  0.9 to 1.0 degrees, from 6378.137 km at the Earth-Moon distance of that hour.
- The elevation arrays hold the centre of the disc, so a body can be visible while its
  elevation is slightly below the horizon.

### `sites.json`: the list of sites

```json
[
  {
    "id": "shackleton-ridge",
    "name": "Lit ridge near Shackleton (computed)",
    "lat": -89.3277,
    "lon": 116.8355,
    "elevation_m": 1200,
    "source": "where the coordinates came from"
  }
]
```

- `mission` is optional. Real mission targets carry it (`"IM-2"`, `"Artemis III candidate"`).
  Computed candidates leave it out.
- `note` is optional: a short caveat the app shows under the site, for example why a mission
  region centre gets no Sun.
- `psr_km` is optional: distance in km to the edge of the nearest permanently shadowed
  region of at least 1 km2, from LOLA/PGDA. It is 0 when the site is inside one. Smaller
  shadows can be much closer, so the app always names the 1 km2 limit.
- `sun_pct_10m` is optional: percent of all the hours of 2027 to 2030 with the Sun visible
  from 10 m above the ground, 1 decimal. Every other number uses 2 m.
- `slope_deg` is optional: slope of the ground at the site in degrees, 1 decimal, from the
  30 m LOLA DEM (Horn 3x3), the same method for every site. It is the slope of a 30 m cell,
  not of a lander footprint.
- The app shows `sun_pct_10m`, `slope_deg` and `psr_km` on the site card when present.

### `sites/<id>.json`: hourly series for one site

```json
{
  "id": "shackleton-ridge",
  "start_utc": "2027-01-01T00:00:00Z",
  "step_minutes": 60,
  "count": 8760,
  "sun_elev_deg": [0.4, 0.6],
  "sun_az_deg": [12.1, 13.0],
  "earth_elev_deg": [3.2, 3.1],
  "earth_az_deg": [201.5, 201.4],
  "sun_visible": [1, 1],
  "earth_visible": [1, 1],
  "horizon": { "az_step_deg": 1, "elev_deg": [0.8, 0.7] }
}
```

- `sun_visible` and `earth_visible` are 1 or 0, already compared against the terrain.
- `horizon.elev_deg` has 360 values: the terrain angle at azimuth 0, 1, 2, ... 359.

### `summary/<id>.json`: per-day totals for one site

```json
{
  "id": "shackleton-ridge",
  "days": [
    {
      "date": "2027-01-01",
      "sun_hours": 18.0,
      "earth_hours": 9.0,
      "both_hours": 7.0,
      "max_sun_elev_deg": 1.6,
      "longest_sun_gap_hours": 4.0
    }
  ]
}
```

One entry per UTC day of the year (365, or 366 in a leap year). `both_hours` counts the hours with the Sun and Earth both visible.
`longest_sun_gap_hours` is the whole dark spell that touches that
day, not just the part inside it, so it can be more than 24. A spell that touches the first
or last day of the year is cut there.

### `ephemeris.json`: where the Sun and Earth are overhead, for custom points

```json
{
  "start_utc": "2027-01-01T00:00:00Z",
  "step_minutes": 60,
  "count": 8760,
  "sub_solar_lon_deg": [263.1159],
  "sub_solar_lat_deg": [-1.0146],
  "sub_earth_lon_deg": [7.1872],
  "sub_earth_lat_deg": [5.996],
  "earth_distance_km": [391461]
}
```

- The sub-solar point is where the Sun is straight overhead. The sub-Earth point is the same
  for Earth. Longitudes here run 0 to 360.
- `earth_distance_km` is from the centre of the Earth to the centre of the Moon.

## How work lands

1. Never push to `main`. Work on a branch: `<name>/<short-description>`.
2. Keep each PR to one feature.
3. Open a PR only when your human says so ("ship it"): commit, push, `gh pr create --fill`.
4. CI runs the check, then an AI review. PASS merges automatically. FAIL comments with
   what to fix and pings the author in Discord. Fix it on the same branch and push again.
5. Before starting new work: `git checkout main && git pull`.

The check is `npm run check` (eslint, `next typegen`, `tsc`, `node --test`) plus `pytest` for `data/`.
Run it before saying anything is done. `story/` changes need no check.

## Tests

- Pure functions (data in, data out, no DOM or rendering) need a test, including one
  known-answer test against a value from a real source.
- Rendering and UI need no tests. The typecheck covers them.

## Pinging people in Discord

Send a ping without asking first, but only in these two cases, and tell your human in the
same reply:

1. You are blocked on a folder someone else owns.
2. Something koum needs for the video or slides is ready.

```bash
gh workflow run notify.yml -f to=gio -f message="need date field from fetchSites()"
```

`to` is `trim`, `gio` or `koum`. No progress updates, no "starting X". You never read
Discord or wait for a reply: stop, and the humans decide what happens next.

## Do not

- Commit `.env` files, API keys or tokens.
- Use any code or material from before the hackathon started, unless the team has confirmed
  it is allowed. Cite every outside source you use in `story/sources.md`, so it can go in
  the submission.
- Commit font files. Fonts load from their CDN CSS link only (licence forbids the files in a public repo).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
