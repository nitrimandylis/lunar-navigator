# data

Owned by gio. Python scripts that fetch and precompute, writing the JSON the app reads.
The app never calls Python at runtime.

## What it makes

For eight sites near the Moon's south pole, for every hour of 2027:

- where the Sun and Earth are in the sky (azimuth and elevation),
- the terrain horizon around the site (so we know when a hill hides them),
- whether each one is visible (Sun = power, Earth = direct-to-Earth comms),
- per-day totals for the site-by-day grid.

It also writes `ephemeris.json`, so the app can work out the Sun and Earth for any custom
point on the Moon.

The files go to `public/data/` and the app loads them from `/data/...`.
**The shapes of those files are the contract: see "Contract" in `AGENTS.md`.**
Do not change them without trim.

## Where it comes from

| What | Source | Used for |
|------|--------|----------|
| Sun, Earth, sub-solar and sub-Earth points, Earth distance | NASA/JPL Horizons (ephemeris DE441), through its web API | `horizons.py`, `ephemeris.py` |
| Terrain | LRO LOLA DEM v4, S Pole: 87.5 deg at 5 m and 75 deg at 30 m, from NASA Moon Trek | `terrain.py` |
| Crater centres | IAU Gazetteer of Planetary Nomenclature (read through Wikipedia) | starting points for `rim_search.py` |

Every source is listed in `story/sources.md`. Add to it when you add a source.

## One-time setup

Python 3.12 or newer.

```bash
python -m venv data/.venv
data/.venv/Scripts/python -m pip install -r data/requirements.txt pytest
```

On macOS and Linux use `data/.venv/bin/python` instead of `data/.venv/Scripts/python`.

The terrain files are about 3.4 GB each, so they are **not in git**. Download them from
NASA Moon Trek (https://trek.nasa.gov/moon/, search for "LRO LOLA DEM", S Pole) and put them in
`data/raw/`, which git ignores. The names must be:

- `data/raw/LRO_LOLA_DEM_SPole875_5mp_v04.tif` (87.5 deg, 5 m per pixel)
- `data/raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif` (75 deg, 30 m per pixel)

Or leave them anywhere and pass `--dem5` and `--dem30`.

## Run it

Tests (no internet or terrain files needed; CI runs the same):

```bash
data/.venv/Scripts/python -m pytest -q
```

Rebuild all the JSON. It needs internet (Horizons) and the two terrain files, and takes about
10 minutes (roughly one minute per site):

```bash
data/.venv/Scripts/python data/build.py
```

Useful options: `--only <site id>` builds one site, `--out <folder>` writes somewhere else,
`--start 2027-01-01 --days 365 --step-minutes 60` change the time range. The app expects the
defaults, so only change them to experiment. `--only` leaves `ephemeris.json` alone.

Re-run `build.py` whenever `sites.json` or the horizon code changes, and commit the new files
in `public/data/`.

## How the pieces fit

```
sites.json ──► build.py ──► public/data/sites/<id>.json    hourly series per site
                  │         public/data/summary/<id>.json  per-day totals per site
                  │         public/data/sites.json         copy of the site list
                  │         public/data/ephemeris.json     for custom points
                  ├── horizons.py       Sun and Earth az/el at a site, from Horizons
                  ├── ephemeris.py      sub-solar and sub-Earth points, from Horizons
                  ├── terrain.py        lat/lon to map position, reads the terrain around a site
                  └── horizon_mask.py   terrain around a site -> horizon angle per compass direction
```

- `horizon_mask.py` walks outward from the site in every direction and keeps the highest
  terrain angle, allowing for the Moon's curvature. A body higher than that angle is visible.
- `terrain.py` looks at full detail out to 25 km, and at a thinned-out copy out to 150 km. A
  5 km mountain can be seen from about 130 km, and ignoring far peaks made the horizon too low
  by up to 8 degrees. The terrain files use a south polar stereographic map projection.
- `build.py` uses the 5 m terrain where the whole 25 km search area fits inside it (very near
  the pole) and the 30 m terrain everywhere else.

## Where the sites come from

`sites.json` is not a NASA list of landing sites. We found the points ourselves with
`rim_search.py`, so say so in the video and slides. The scan looks for points with the most
hours of Sun and Earth near each crater, and for a lit point and a dark point a few km apart
near Shackleton. The Sun and Earth directions are reused from one Horizons series for the
whole region (checked against Horizons at a second site, within 0.01 degrees for the Sun),
so only the terrain horizon is worked out per point. The best few points are then scored again
with the full 150 km horizon.

```bash
# best point near each crater (about 10 minutes)
data/.venv/Scripts/python data/rim_search.py --dem30 data/raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif --out craters.json craters

# a lit point and a dark point 2 to 6 km apart, near a given centre
data/.venv/Scripts/python data/rim_search.py --dem30 data/raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif --out pair.json pair --center-lat -89.67 --center-lon 129.78
```

`rim_candidates.json` keeps the results behind the current `sites.json`. To change the site
list, edit `sites.json` by hand (id, name, lat, lon, elevation, source), then run `build.py`.
Read `elevation_m` from the terrain file.

## Known simplifications

- The Sun and Earth are treated as points (their centres). The Sun is about 0.5 degrees wide
  and Earth about 1.9, so rise and set times are off by a few minutes.
- `longest_sun_gap_hours` is counted inside each UTC day, so a gap across midnight is cut.
- The Moon has no atmosphere, so there is no refraction.
- Terrain is the LOLA data through September 2011. Nothing is modelled for the lander's height.
- Custom points on the map get Sun and Earth from `ephemeris.json` but no terrain horizon.
