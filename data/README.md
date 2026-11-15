# data

Owned by gio. Python scripts that fetch and precompute, writing the JSON the app reads.
The app never calls Python at runtime.

## What it makes

For the 18 sites in `sites.json`, near the Moon's south pole, for every hour of 2027:

- where the Sun and Earth are in the sky (azimuth and elevation),
- the terrain horizon around the site, seen from 2 m above the ground (so we know when a hill hides them),
- whether each one is visible (Sun = power, Earth = direct-to-Earth comms), counting any part of
  its disc above the horizon,
- per-day totals for the site-by-day grid: hours of Sun, hours of Earth, hours of both at once
  (`both_hours`), highest Sun, and the longest Sun gap. A day is a UTC day for all of them.

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
data/.venv/Scripts/python -m pytest data -q
```

`tests/test_public_data.py` also checks the committed files in `public/data/` against
`sites.json` (one file per site, array lengths, `both_hours` matching the hourly visibility).
So if you change `sites.json` and forget to rebuild, it fails.

Rebuild all the JSON. It needs internet (Horizons) and the two terrain files, and takes
roughly one minute per site:

```bash
data/.venv/Scripts/python data/build.py
```

Useful options: `--only <site id>` builds one site, `--out <folder>` writes somewhere else,
`--start 2027-01-01 --days 365 --step-minutes 60` change the time range, and
`--observer-height 2` (metres above the ground, the default) changes the viewer height. The app expects the
defaults, so only change them to experiment. `--only` leaves `ephemeris.json` and the other sites' files alone. It still rewrites
`sites.json` in the output folder, from the full list.

Re-run `build.py` whenever `sites.json` or the horizon code changes, and commit the new files
in `public/data/`. After adding or changing one site, `build.py --only <site id>` is enough.

## Later years (2028 to 2040)

2027 stays exactly where it was (`public/data/sites/`, `summary/`, `ephemeris.json`), and
`public/data/sites.json` is still the one site list. Each later year has its own folder with the
same three things inside, and no `sites.json` of its own:

```
public/data/2028/sites/<id>.json      hourly series, same shape as 2027 (8784 samples, 2028 is a leap year)
public/data/2028/summary/<id>.json    per-day totals (366 days)
public/data/2028/ephemeris.json       sub-solar / sub-Earth points
public/data/2029/...                  8760 samples, 365 days
public/data/2030/...                  8760 samples, 365 days
public/data/2031/ ... 2040/           same layout; 2032, 2036 and 2040 are leap years (8784 samples, 366 days),
                                      the others 8760 / 365
```

`start_utc` is `<year>-01-01T00:00:00Z`; `count` is 24 x days in that year. Built with, per year
(the folder name must match the year):

```bash
data/.venv/Scripts/python data/build.py --out public/data/2028 --start 2028-01-01 --days 366
data/.venv/Scripts/python data/build.py --out public/data/2029 --start 2029-01-01 --days 365
data/.venv/Scripts/python data/build.py --out public/data/2030 --start 2030-01-01 --days 365
# ... and the same for 2031 to 2040 (--days 366 for 2032, 2036, 2040)
```

The DEM paths default to `data/raw/`; pass `--dem5` and `--dem30` if the .tif files are elsewhere.
Horizons serves these years from the DE441 kernel (checked through 2040-12-31 for the Sun and Earth
as seen from the Moon). A full year takes about 18 minutes for all 18 sites.

`build.py` also drops a copy of `sites.json` into `--out`; delete it from the year folder (it is
not part of the layout, and `test_public_data.py` fails if it is there). Horizons limits rows per
request; `horizons.MAX_STEPS_PER_REQUEST` already splits the fetch. The app does not load these
years yet. `test_public_data.py` checks every year (start date, day count, last date, hourly
counts, `both_hours` against the hourly visibility).

## Basemap image

`basemap.py` renders the real south pole terrain as a grey hillshade picture for the app map.
It writes `public/data/basemap.png` (30 m DEM, out to latitude -82) and `basemap-87.5.png` (5 m DEM,
out to latitude -87.5, for zooming near the pole), each with a `.json` next to it that says how to place it.
Both are 2048 x 2048, 8-bit greyscale with alpha; pixels outside the edge circle are transparent.

```bash
data/.venv/Scripts/python data/basemap.py --dem5 <5 m .tif> --dem30 <30 m .tif> --out public/data
```

(`--size` changes the pixels across, `--only basemap` renders one tile. It reads the DEMs in a
window, averaged down, so it never loads the 3.7 GB file whole. About 20 seconds.)

Projection: the same as the app map (`projectSouthPole` in `lib/geometry.ts`): azimuthal
equidistant, distance from the centre proportional to degrees from the pole, longitude 0 up,
east longitude clockwise (lon 90 to the right). The DEMs are polar stereographic, so each pixel
is looked up in the DEM through `terrain.lonlat_to_xy`. For an image of `size` pixels with
outer latitude `edge`, with angles in degrees:

```
r = (size / 2) * (lat + 90) / (edge + 90)
x = size / 2 + r * sin(lon)        y = size / 2 - r * cos(lon)       (x right, y down)
lat = -90 + hypot(x - size/2, size/2 - y) / (size/2) * (edge + 90)
lon = atan2(x - size/2, size/2 - y)
```

Hillshade: light from azimuth 315 degrees (upper left), 20 degrees up, heights stretched 2x.
The real Sun at the pole is under 2 degrees high, so this is a made-up light chosen to make craters readable,
not an illumination map. Credit: LRO LOLA DEM v4 S Pole (30 m and 5 m), NASA Moon Trek.
The JSON files hold all the numbers (extent, pixel size, settings).

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

rim_search.py, repick_pair.py   find points for sites.json (not run by build.py)
tests/                          pytest checks, including test_public_data.py and test_known_answer.py
```

- `horizon_mask.py` walks outward from the site in every direction and keeps the highest
  terrain angle, allowing for the Moon's curvature. A body higher than that angle is visible.
- `terrain.py` looks at full detail out to 25 km, and at a thinned-out copy out to 150 km. A
  5 km mountain can be seen from about 130 km, and ignoring far peaks made the horizon too low
  by up to 8 degrees. The terrain files use a south polar stereographic map projection.
- The viewer is 2 m above the ground (`terrain.DEFAULT_OBSERVER_HEIGHT_M`, option `--observer-height`),
  because published polar illumination studies use 2 m (taken from summaries of those studies, not
  checked against the papers). `rim_search.py` uses the same height, so scans and builds agree.
  Standing on the ground (0 m) hides more of the Sun, so the heights are not interchangeable.
- `build.py` uses the 5 m terrain where the whole 25 km search area fits inside it (very near
  the pole) and the 30 m terrain everywhere else.

## `sun_pct_10m` (optional site field)

`sun_pct_10m` in `sites.json` (both copies) is the percent of all hours of 2027 to 2030 (35,064
hours) with any part of the Sun's disc above the horizon seen from a 10 m observer height,
rounded to 1 decimal. The 2 m figures are in the hourly files (`sun_visible`); later years are not
included. It is computed by `data/sun_pct_10m.py`, which reuses `build.py`'s rule exactly (same
DEM choice and ranges, 1 degree horizon, nearest-azimuth lookup, Sun as a disc, no refraction)
with only the observer height changed, and the Sun az/el from the committed hourly files:

```bash
data/.venv/Scripts/python data/sun_pct_10m.py --validate   # 2 m check against committed sun_visible
data/.venv/Scripts/python data/sun_pct_10m.py --write      # compute at 10 m and update both sites.json
```

`--validate` reproduces the committed 2027 `sun_visible` exactly for most sites; a site can differ
by an hour or two where the Sun sits on the horizon edge, because the committed az/el are rounded.
It does not change `terrain.DEFAULT_OBSERVER_HEIGHT_M`, which stays at 2 m.

## Where the sites come from

`sites.json` has three kinds of site. It is not a NASA list of landing sites.

- **Computed points** (name ends in "(computed)"; the `de-gerlache-candidate`, `haworth-candidate`
  and similar ones, the Shackleton and Sverdrup lit/dark pairs, `connecting-ridge`). We found these
  ourselves by scanning the terrain with `rim_search.py` or `repick_pair.py`, so say so in the
  video and slides. They have no `mission` field.
- **Mission sites** with a `mission` string: `im2-mons-mouton` (`"IM-2"`) and the three Artemis III
  candidate regions `artemis3-haworth`, `artemis3-malapert-massif`, `artemis3-nobile-rim-1`
  (`"Artemis III candidate"`). The IM-2 point is the intended landing site from the LROC team
  page (https://lroc.im-ldi.com/images/1401). The Artemis III points are the region centres on the
  third-party Lunar Resources Registry map (https://lunarresourcesregistry.com/south-pole-map/),
  not a NASA file, and a region centre is not a landing spot. Their `elevation_m` is read from the
  terrain file. A scan of the whole region around the centre (about 15 km x 15 km, 500 m grid, 2 m observer, 150 km horizon) found no point with any Sun in 2027, so this region has no sunlit spot at this observer height. The nearest lit Haworth point in our list is the computed `haworth-candidate`, outside the region (about 45 km from -87.45, -5.0, great-circle).
- **`connecting-ridge`**: the best-lit point we found by scanning within about 6 km of the
  registry centre of the Connecting Ridge. `tests/test_known_answer.py` checks its sunlit share
  for 2027 against Glaser et al. 2014 (92.27 percent at 2 m, over 19 years), with a loose
  tolerance of 10 points. It is a plausibility check, not a replication: their exact point is
  unknown.

The scan looks for points with the most hours of Sun and Earth near each crater, and for a lit
point and a dark point a few km apart. The Sun and Earth directions are reused from one Horizons
series for the whole region (checked against Horizons at a second site, within 0.01 degrees for
the Sun), so only the terrain horizon is worked out per point. The best few points are then
scored again with the full 150 km horizon. The scans treat the Sun as a point at its centre, so
their hour counts differ a little from `build.py`, which uses discs. The numbers in the app come
from `build.py`.

Both modes need an hourly site file for the Sun and Earth directions. By default that is
`public/data/sites/shackleton-ridge.json`, which is committed. If it is missing or you changed the
site list, run `build.py` first (or pass `--reference` and its `--reference-lat/--reference-lon`).

```bash
# best point near each crater (about 10 minutes; --only <crater name> for one)
data/.venv/Scripts/python data/rim_search.py --dem30 data/raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif --out craters.json craters

# a lit point and a dark point 2 to 6 km apart, near a given centre
data/.venv/Scripts/python data/rim_search.py --dem30 data/raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif --out pair.json pair --center-lat -89.67 --center-lon 129.78
```

`repick_pair.py` repeats the Shackleton lit/dark pair (`shackleton-ridge` and `shackleton-shadow`)
in more detail: a coarse scan, a re-score on the 5 m terrain, then a 50 m refinement. It needs both
terrain files. It prints the pair and writes only `--out`. Command, from the repo root:

```bash
data/.venv/Scripts/python data/repick_pair.py --dem5 data/raw/LRO_LOLA_DEM_SPole875_5mp_v04.tif     --dem30 data/raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif --out pair.json     --center-lat -89.43 --center-lon 222.5 --radius-m 3000     --workers 2 --fine-workers 2 --rescore-top 100 --refine-radius-m 1500
```

`rim_candidates.json` keeps the scan results behind the computed sites (its `note` says which
were re-scanned). To change the site list, edit `sites.json` by hand (id, name, lat, lon,
elevation, source, `mission` for a real mission site, the optional `slope_deg` and the optional `note`, left out otherwise), then run
`build.py`. Read `elevation_m` from the terrain file.

An optional `note` string may carry a caveat the app shows with the site. Only `artemis3-haworth` has one
(its centre is on the shadowed crater floor and gets 0 h of Sun). It goes after `mission` in `sites.json`,
`build.py` copies it through to `public/data/sites.json`, and the data tests require it to be a non-empty
string when present.

## Ground slope (`slope_deg`)

An optional number on every site: the ground slope at the site in degrees, 0 to under 90, rounded to
1 decimal. The app shows it on the site card. `slope.py` computes it and can write both `sites.json`
files (`--write`); `build.py` copies it through, so no rebuild of the hourly files is needed.

- **DEM**: LRO LOLA DEM v4 S Pole, 30 m per pixel (75 deg to the pole). One method for all sites, so
  the numbers are comparable. The 5 m DEM only reaches 87.5 S, so 9 of the 18 sites have no 5 m cover.
- **Method**: Horn (1981) 3x3 slope on the 30 m DEM, so the baseline is the 30 m pixel spacing. The
  gradient is worked out at the four pixel centres around the site and blended bilinearly to the exact
  point.
- **Scale**: pixel spacing is the true ground distance, `30 m / terrain.scale_factor(lat)`, as in
  `terrain.py` (the factor is 1.0 at the pole and about 1.002 at 85 S).
- **Cross-check** (`slope.py --dem5 ...`): the 5 m DEM averaged into 30 m cells centred on the site,
  then the same Horn formula. For the 9 sites both DEMs cover, it differs from the 30 m method by
  0.15 to 1.02 degrees (mean absolute 0.53; largest: `shackleton-shadow` 3.61 vs 2.59 and
  `shackleton-ridge` 0.97 vs 1.59). Both read the same terrain, so the gap is mostly where the 30 m
  cell grid falls, and it shows how uncertain a slope this small is. `elevation_m` agrees with the
  DEM height to a few metres.
- **Caveat**: this is the slope of a 30 m cell, not of a lander footprint (a few metres). Boulders,
  small craters and rough ground inside the cell are averaged out, so the slope under a lander can
  be much steeper or flatter. It also inherits the DEM's error (LOLA data through September 2011).

```bash
data/.venv/Scripts/python data/slope.py --dem30 <30 m .tif> --dem5 <5 m .tif> --write
```

## `psr_km`: distance to the nearest permanently shadowed region

Every site has an optional number `psr_km`: the ground distance in km from the site to the edge of
the nearest permanently shadowed region (PSR), rounded to 0.01 km, and 0 when the site lies inside
a PSR. It is **a distance to the nearest PSR polygon edge, not time in shadow**: a site 0.3 km from a PSR
can still have Sun for most of the year, and a site inside a PSR has no direct sunlight at all.
`build.py` copies the field through `sites.json` unchanged (it copies the whole file), so no hourly,
summary or ephemeris file depends on it.

- **Source.** NASA PGDA, "A New View of the Lunar South Pole from LOLA" (product 90), file
  `LPSR_80S_20MPP_ADJ_1km2.SHP` (shapefile of PSRs larger than 1 km2, 20 m LOLA grid, 80 S to the
  pole, 20.7 MB; N = 1,531 polygons), https://pgda.gsfc.nasa.gov/products/90 ,
  https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LPSR_80S_20MPP_ADJ_1km2.SHP . Barker et al. 2023, PSJ 4,
  183; data DOI 10.60903/gsfcpgda-lola-spole. The method descends from Mazarico et al. 2011.
- **PSR definition.** A PSR is ground that never receives direct sunlight, from horizon masks built
  on LOLA topography and simulated over lunar precession cycles (18.6 years) with the Sun as a disc
  (Mazarico et al. 2011, Icarus 211, 1066; NTRS 20120010094). The PGDA product page does not itself
  state the time span or the Sun model; we took them from the papers and did not check them in the
  product's label file. It is LOLA's product, not ours, and unlike our DEM-based hours it does not use
  our 2 m observer height.
- **Minimum area: 1 km2.** The file only has PSRs larger than 1 km2 (the PGDA's own cut; the full
  20 m file has 506,349 polygons, mostly tiny). Smaller cold traps are not counted, so a site can be
  closer to a sub-km2 shadow than `psr_km` says. For comparison, the Mazarico 2011 raster
  (`LPSR_85S_060M_201608`, 60 m, 85 S to the pole, flags every shadowed pixel) puts the 14 sites south of 85 S within 0.02 to 3.75 km of some PSR pixel, e.g. `shackleton-shadow`
  0.02 km, `haworth-candidate` 0.14 km, `shackleton-ridge` 0.34 km. The other four (`amundsen-candidate`,
  `cabeus-candidate`, `nobile-candidate`, `im2-mons-mouton`) lie outside that raster.
- **Method.** `psr_distance.py`: site (lat, lon) to `terrain.lonlat_to_xy` (south polar
  stereographic, same projection as the shapefile), minimum point-to-segment distance to every
  polygon ring, 0 if inside (even-odd, holes are not PSR), divided by `terrain.scale_factor` to give
  ground distance. `data/psr_polygons.json` (1.7 MB) holds only the 72 polygons with an edge within
  19.5 km of a site, in integer metres; every site's nearest PSR is within that radius and the script
  refuses to run if one is not. The downloaded shapefile itself is not in git. To regenerate:

```bash
data/.venv/Scripts/python data/psr_distance.py shp <LPSR_80S_20MPP_ADJ_1km2.SHP>   # rebuild psr_polygons.json
data/.venv/Scripts/python data/psr_distance.py sites --write                       # update both sites.json files
```

- **Caveats.** Positions of our computed sites are on the 5 m / 30 m DEM; the PSR edges come from a
  20 m grid, so edges carry a few tens of metres of uncertainty. `shackleton-ridge` and
  `shackleton-shadow` are not in the crater floor (they are rim-side points, 6 km from the 1 km2
  PSRs); `artemis3-haworth` is the only site inside a PSR (0).

Citation block (paste into slides or the video notes):

> Distance to nearest permanently shadowed region: computed from the LOLA PSR map of the lunar south
> pole (NASA PGDA, `LPSR_80S_20MPP_ADJ_1km2`, PSRs larger than 1 km2). Barker, M. K., et al. (2023),
> Planetary Science Journal 4, 183, doi:10.3847/PSJ/acf3e1; data doi:10.60903/gsfcpgda-lola-spole.
> PSR method: Mazarico, E., et al. (2011), Illumination conditions of the lunar polar regions using
> LOLA topography, Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030.

If the PSR file could not be had, the fallback would be to derive PSRs from our own DEM (zero Sun
hours over a long span from horizon masks) and label the result as derived, not LOLA's product. It
was not needed.

## Known simplifications

- Sun and Earth are discs, not points. A body is visible when any part of its disc is above the
  terrain horizon, the same rule as sunrise and sunset. Radii: Sun 695,700 km at 1 au (0.266
  degrees; its size changes by under 2 percent over a year), Earth 6,378.137 km at the real
  Earth-Moon distance for each hour (0.9 to 1.0 degrees). Both are the values JPL Horizons uses.
- `longest_sun_gap_hours` is the whole dark spell that touches the day, so it can be more than 24.
  A spell that touches the first or last hour of a year's file is cut there.
- The Moon has no atmosphere, so there is no refraction.
- Terrain is the LOLA data through September 2011. The viewer is a fixed 2 m above the ground (a stand-in for a lander's panel or antenna height); the
  lander itself, and any height other than the one set by `--observer-height`, is not modelled.
- Custom points on the map get Sun and Earth from `ephemeris.json` but no terrain horizon.
- Mission sites are a single point (the published landing site, or a region centre), not the whole region.
