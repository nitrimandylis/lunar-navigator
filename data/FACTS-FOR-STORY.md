# Facts for the story (slides, submission page)

Written by gio's agent on 14 November 2026 for koum. Every claim here was checked against the
code or the committed files in `public/data/` at the commit this file was added in. Copy from
this file; if something is not here, ask gio rather than guess. Words like "about" and
"plausibility check" are deliberate: please keep them.

All hours below come from the committed hourly files `public/data/sites/<id>.json`
(8760 hourly samples, 2027-01-01 00:00 UTC to 2027-12-31 23:00 UTC). Percent = hours / 8760 x 100,
rounded to one decimal.

## 1. Sun and Earth positions

| Item | What we did | Where |
|---|---|---|
| Source | NASA/JPL Horizons web API, `https://ssd.jpl.nasa.gov/api/horizons.api`. Saved responses in `data/tests/fixtures/` show it used ephemeris DE441 | `data/horizons.py`, `data/ephemeris.py` |
| Targets | Sun (body 10) and Earth (body 399), one query each per site | `horizons.py` |
| Observer | A point on the Moon's surface: centre `coord@301` (Moon), geodetic site coordinates `lon, lat, 0 km` (east-positive longitude, height 0 above the Moon's 1737.4 km reference sphere) | `horizons.py` |
| Quantity | Horizons table item 4, azimuth and elevation, in degrees. Azimuth is clockwise from north. Elevation is above a smooth Moon (flat horizon = 0) | `horizons.py` |
| Time | 2027-01-01 00:00 to 2027-12-31 23:00, step 60 minutes, 8760 samples. Horizons printed "UT" in the saved responses. We treat the times as UTC | `build.py`, fixtures |
| Refraction | None. The saved Horizons responses say `Atmos refraction: NO (AIRLESS)` | fixtures |
| Requests | A year is fetched in pieces of at most 720 hourly steps (Horizons rejects very long tables) | `horizons.MAX_STEPS_PER_REQUEST` |
| Earth size input | A second Horizons query for the Moon seen from the centre of the Earth gives the Earth-Moon distance per hour (items 14, 15, 20 also give the sub-Earth and sub-solar points for `ephemeris.json`) | `ephemeris.py` |
| Units | Degrees for angles, kilometres for Earth distance. Horizons gives the distance in au; we multiply by 149,597,870.7 km/au and round to whole km in `ephemeris.json` | `ephemeris.py` |

Over 2027 the Earth-Moon distance in `ephemeris.json` runs 357,288 to 406,603 km.

## 2. Terrain

| Item | Value |
|---|---|
| Product | LRO LOLA DEM v4, South Pole, from NASA Moon Trek (https://trek.nasa.gov/moon/) |
| Files used | `LRO_LOLA_DEM_SPole875_5mp_v04.tif` (87.5 deg to the pole, 5 m per pixel) and `LRO_LOLA_DEM_SPole75_30mp_v04.tif` (75 deg to the pole, 30 m per pixel). Both are about 3.4 GB and not in git |
| Which one per site | 5 m file when the whole 25 km search circle fits inside it, otherwise 30 m (`build.pick_dem`). The 5 m file serves the Shackleton pair, `de-gerlache-candidate`, the Sverdrup pair and `connecting-ridge`; the 30 m file serves the other 12 sites (as stated in each site's `source` field) |
| Horizon method | For each of 360 azimuths (1 degree step) walk outward from the site and keep the highest terrain angle, allowing for the Moon's curvature (`horizon_mask.horizon_profile`) |
| Near range | Full-detail terrain out to 25 km (`MAX_RANGE_M = 25_000`) |
| Far range | 25 km to 150 km from the 30 m file, thinned 4x by keeping the highest cell in each 4 x 4 block (`FAR_RANGE_M = 150_000`). Reason from the code: a 5 km peak can be seen from about 130 km. The README says ignoring far peaks made the horizon too low by up to 8 degrees. The higher of the near and far horizons is used |
| Observer height | 2 m above the ground (`terrain.DEFAULT_OBSERVER_HEIGHT_M`). A stand-in for a lander panel or antenna height. The README says published polar illumination studies use 2 m, taken from summaries, not checked against the papers |
| Terrain date | LOLA data through September 2011 (from the README) |
| Output | The horizon elevation per azimuth is stored in each site file (`horizon.elev_deg`, 360 values) |

## 3. Visibility rule

- Sun and Earth are discs, not points. A body counts as visible in an hour when any part of its disc
  is above the terrain horizon, the same idea as sunrise and sunset (`horizon_mask.disc_visible_mask`).
- The disc is checked at 25 points: the centre, 16 points on the rim and 8 points halfway out. The
  horizon is read at the nearest whole degree of azimuth.
- Sun radius: 0.2665 degrees (Sun radius 695,700 km at 1 au). The README says it changes by under 2 percent over a year.
- Earth radius: `asin(6378.137 km / Earth-Moon distance)` for each hour. Over 2027 that is 0.899 to
  1.023 degrees (the README says "0.9 to 1.0"). The distance used is centre of Earth to centre of Moon, not to the site.
- No refraction (no atmosphere).
- The elevation arrays hold the disc centre, so a body can be visible while its centre elevation is
  slightly below 0 (for example `shackleton-ridge`, 1 June 2027, 24 h of Sun and a highest centre elevation of -0.824 degrees).
- Daily totals are by UTC day (`summary/<id>.json`, 365 days).

| Field | Meaning |
|---|---|
| `sun_hours` | Hours in that UTC day with any part of the Sun above the terrain horizon |
| `earth_hours` | Same for Earth |
| `both_hours` | Hours in that UTC day when both are visible at the same time |
| `max_sun_elev_deg` | Highest elevation of the Sun's centre that day (degrees) |
| `longest_sun_gap_hours` | The whole unbroken dark spell (no Sun) that touches that day. It can be more than 24 because it is not cut at midnight. A spell touching the first or last hour of 2027 is cut there |

Hourly visibility is 1 or 0. Totals are sums of those hours (each hour counts fully).

## 4. Missing values

There are none, and there is no gap code. I checked all 18 hourly files: every array has 8760
values, every horizon has 360 values, no value is null, and `sun_visible` and `earth_visible` hold only 0 and 1.
The summary files have 365 days each, and their daily sums match the hourly files for all 18 sites.
Horizons returns every requested sample or the build stops with an error
(`fetch_series` raises if the count differs). The build also stops if the terrain file has
no-data cells near a site. So a 0 means "terrain or geometry hides it", never "no data".

## 5. The sites

Formula: hours = number of 1s in `sun_visible` (and `earth_visible`; both = hours where both are 1) in the site's committed hourly file. Percent = hours / 8760 x 100.
Elevation is metres above the 1,737,400 m reference sphere, read from the LOLA file.

Real mission sites (have a `mission` field): the IM-2 landing point and the three Artemis III regions.
Everything else is a point we computed by scanning the terrain, not a NASA site.

| Site id | Name | Lat | Lon (E) | Elev m | Sun h | Sun % | Earth h | Earth % | Both h | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| shackleton-ridge | Lit ridge near Shackleton | -89.4387 | -137.4999 | 1960 | 7936 | 90.6 | 4847 | 55.3 | 4702 | computed |
| shackleton-shadow | Shadowed ground near Shackleton | -89.3690 | -136.5882 | 1591 | 0 | 0.0 | 0 | 0.0 | 0 | computed |
| connecting-ridge | Best-lit point on Connecting Ridge | -89.4739 | -137.3158 | 1950 | 7994 | 91.3 | 4838 | 55.2 | 4419 | computed |
| de-gerlache-candidate | Candidate near de Gerlache | -88.3355 | -69.5771 | 1298 | 4955 | 56.6 | 5090 | 58.1 | 2913 | computed |
| haworth-candidate | Candidate near Haworth | -85.9620 | -2.3833 | 4994 | 6677 | 76.2 | 8760 | 100.0 | 6677 | computed |
| malapert-candidate | Candidate near Malapert | -85.7378 | 3.6101 | 4017 | 4472 | 51.1 | 8760 | 100.0 | 4472 | computed |
| nobile-candidate | Candidate near Nobile | -84.2273 | 47.4917 | 5402 | 4747 | 54.2 | 8760 | 100.0 | 4747 | computed |
| faustini-candidate | Candidate near Faustini | -88.1542 | 73.3088 | -276 | 2932 | 33.5 | 4506 | 51.4 | 1951 | computed |
| amundsen-candidate | Candidate near Amundsen | -82.7489 | 72.9299 | 2805 | 3226 | 36.8 | 6920 | 79.0 | 2586 | computed |
| cabeus-candidate | Candidate near Cabeus | -84.3857 | -26.8578 | 400 | 3119 | 35.6 | 7729 | 88.2 | 2776 | computed |
| sverdrup-candidate | Candidate near Sverdrup | -88.1042 | -164.2726 | -516 | 1485 | 17.0 | 2975 | 34.0 | 647 | computed |
| slater-candidate | Candidate near Slater | -87.7170 | 115.1188 | 60 | 3220 | 36.8 | 4147 | 47.3 | 1508 | computed |
| sverdrup-pair-lit | Lit ground near Sverdrup | -88.8259 | -158.6620 | -258 | 3551 | 40.5 | 1707 | 19.5 | 613 | computed |
| sverdrup-pair-shadow | Shadowed ground near Sverdrup | -88.8053 | -162.5642 | -272 | 262 | 3.0 | 0 | 0.0 | 0 | computed |
| im2-mons-mouton | IM-2 landing site, Mons Mouton | -84.7800 | 29.1300 | 5312 | 3935 | 44.9 | 8078 | 92.2 | 3666 | mission (IM-2) |
| artemis3-haworth | Haworth region centre | -87.4500 | -5.0000 | -3318 | 0 | 0.0 | 513 | 5.9 | 0 | mission (Artemis III region centre) |
| artemis3-malapert-massif | Malapert Massif region | -86.0000 | 2.7000 | 5142 | 5085 | 58.0 | 6956 | 79.4 | 3867 | mission (Artemis III region centre) |
| artemis3-nobile-rim-1 | Nobile Rim 1 region | -85.3000 | 31.5000 | 6145 | 3678 | 42.0 | 8760 | 100.0 | 3678 | mission (Artemis III region centre) |

Sources behind the coordinates:

- Computed points (rows marked "computed"): found by us with `data/rim_search.py` or `data/repick_pair.py`
  (best Sun and Earth hours near a crater, or a lit/dark pair a few km apart). Say "computed" or "found by our scan"
  in the video and slides. Names like "candidate near Haworth" mean candidate points we picked; they are not NASA candidates, and
  a point may sit on a neighbouring ridge or peak.
- IM-2: the intended landing site published by the LROC team (Robinson, 26 Feb 2025,
  https://lroc.im-ldi.com/images/1401): 84.78 S, 29.13 E.
- Artemis III: the centre point of each of three NASA candidate regions as listed on a third-party map, the Lunar Resources
  Registry south pole map (https://lunarresourcesregistry.com/south-pole-map/). It is not a NASA file, and a region centre is not a landing spot.
  The whole region is not modelled, only that one point.
- `connecting-ridge`: best-lit point found by scanning within about 6 km of the registry centre of the Connecting Ridge
  (-89.45, -136.0, same third-party map).
- Longitudes are east-positive in the files and in this table. `rim_candidates.json` uses 0 to 360 (so -137.49989 is 222.50011 there).

Things to say carefully:

- The Artemis III Haworth centre gets 0 hours of Sun in 2027 in our data (a low floor, -3318 m). That is a statement about that centre point
  (a permanently shadowed area), not about the Haworth region as a whole. The `haworth-candidate` point on the rim gets 76.2 percent. A scan of the whole region around the centre (about 15 km x 15 km, 500 m grid, 2 m observer, 150 km horizon) found no point with any Sun in 2027, so this region has no sunlit spot at this observer height. The nearest lit Haworth point in our list is the computed `haworth-candidate`, outside the region (about 45 km from -87.45, -5.0, great-circle).
- `shackleton-shadow` gets 0 Sun and 0 Earth hours for the whole year at the 2 m observer height.

## 6. One reproducible comparison: the Shackleton lit/dark pair

Sites `shackleton-ridge` (lit) and `shackleton-shadow` (dark), about 2.1 km apart (2132 m by the stored coordinates in the south polar map projection, and rim_candidates.json says 2132 m). Both are computed points near Shackleton crater, not mission sites. Same window for both, same 2 m observer, same terrain method.

Window A: the whole year, 2027-01-01 00:00 UTC to 2027-12-31 23:00 UTC (8760 h).

| Site | Sun h | Sun % | Earth h | Earth % | Both h | Both % | Longest Sun gap |
|---|---|---|---|---|---|---|---|
| shackleton-ridge | 7936 | 90.6 | 4847 | 55.3 | 4702 | 53.7 | 162 h |
| shackleton-shadow | 0 | 0.0 | 0 | 0.0 | 0 | 0.0 | whole year dark (8760 h) |

Window B: May 2027, 2027-05-01 00:00 UTC to 2027-05-31 23:00 UTC (31 days, 744 h).

| Site | Sun h | Sun % of 744 | Earth h | Earth % | Both h | Both % | Longest Sun gap |
|---|---|---|---|---|---|---|---|
| shackleton-ridge | 512 | 68.8 | 457 | 61.4 | 436 | 58.6 | 162 h (2027-05-14 06:00 to 2027-05-21 00:00 UTC) |
| shackleton-shadow | 0 | 0.0 | 0 | 0.0 | 0 | 0.0 | all 744 h dark |

How to say it: "Two points about 2 km apart. Over May 2027 the lit ridge has the Sun for 512 of 744 hours and a direct line to Earth for 457 hours; the shadowed point has neither, for the whole month."
Note the ridge is not lit all the time: its longest dark spell is 162 hours (about 6.75 days), in May 2027.

Month-by-month for the ridge (Sun h / Earth h / Both h), for a chart: Jan 744/363/363, Feb 659/365/352, Mar 611/368/308, Apr 496/432/381, May 512/457/436, Jun 549/430/430, Jul 693/451/451, Aug 744/425/425, Sep 720/376/376, Oct 744/375/375, Nov 720/370/370, Dec 744/435/435. The shadow point is 0/0/0 every month.

Reproduce (needs only Python and the committed files, no internet, run from the repo root):

```python
import json
for sid in ("shackleton-ridge", "shackleton-shadow"):
    d = json.load(open(f"public/data/sites/{sid}.json"))
    i0, i1 = 24 * (31 + 28 + 31 + 30), 24 * (31 + 28 + 31 + 30 + 31)   # 2027-05-01 .. 2027-06-01 (hours since 2027-01-01 00:00 UTC)
    sun, earth = d["sun_visible"][i0:i1], d["earth_visible"][i0:i1]
    print(sid, sum(sun), sum(earth), sum(a & b for a, b in zip(sun, earth)))
```

Expected output: `shackleton-ridge 512 457 436` and `shackleton-shadow 0 0 0`. For the whole year use `[0:8760]`.
You can also add up `sun_hours`, `earth_hours` and `both_hours` over the days 2027-05-01 to 2027-05-31 in `public/data/summary/<id>.json`. That gives the same numbers (checked).

## 7. Validation

Known-answer check (`data/tests/test_known_answer.py`, runs offline from the committed file):

| | Value |
|---|---|
| Our point | `connecting-ridge`, best-lit point found by our scan near the registry centre of the Connecting Ridge |
| Our result | 7994 h of Sun in 2027 = 91.26 percent (2 m observer, Sun as a disc) |
| Published value | Glaser et al. 2014, Icarus 243, 78-90, https://elib.dlr.de/94242: 92.27 percent sunlit at 2 m above ground, over 19 years (they also give 95.65 percent at 10 m) |
| Difference | 1.01 points. The test tolerance is plus or minus 10 points, so it passes |

Say this honestly: it is a plausibility check, not a replication.

- The paper's best point has no readable latitude/longitude, so we compare against the best-lit point we found on the same ridge, not the paper's point.
- The paper covers 19 years; we cover only 2027.
- Whether the paper treats the Sun as a point at its centre or as a disc is unconfirmed. We use a disc.
- The tolerance is deliberately loose (10 points). It says our number is the right size, not that it is exact.
- The paper numbers (92.27, 95.65, 2 m, 10 m, 19 years) are quoted as given by gio, not re-read from the paper by this agent.

Terrain-pipeline check (the Shackleton pair): `data/repick_pair.py` re-finds a lit/dark pair from scratch (coarse scan, re-score on the 5 m
terrain with the 150 km horizon, 50 m refinement). gio reports it lands within about 70 m of the committed `shackleton-ridge`/`shackleton-shadow` points. The scoring there treats the Sun as a point at its centre, so it is not the same rule as `build.py`: for the ridge the scan scores 7661 h, while `build.py` (discs) gives 7936 h. So the two agree closely but are not exactly equal.
See the "Not verified" list: the 70 m figure could not be re-run here (the terrain files are not in the repo).

## 8. Known limitations and simplifications

- This is geometry only: when the Sun or Earth is above the terrain horizon. It is not a power budget, a thermal
  analysis or a radio link budget. "Earth visible" means any part of Earth's disc is above the terrain horizon; it does not say a link would work.
- Sun and Earth are always treated as discs with fixed radii (Sun at 1 au; Earth at the hourly Earth-Moon distance, measured from Earth's centre to the Moon's centre).
- Observer is a fixed 2 m above the ground. The lander itself, its panels, and any other height are not modelled.
- One sample per hour. A body that rises and sets within an hour is not resolved, and each hour counts fully or not at all.
- Horizon is read at 1 degree of azimuth, with the 25-point disc test; fine terrain features narrower than that are smoothed.
- Terrain is LOLA data through September 2011, at 5 m or 30 m (far terrain thinned). Errors in the DEM are not propagated.
- Only 2027 (365 UTC days) is computed. Other years are not.
- Computed points are our scan results, not official sites. Mission rows are a single point (IM-2 intended landing site, or a region centre taken from a third-party map), not a region.
- Custom points on the map get Sun and Earth from `ephemeris.json` but no terrain horizon (flat smooth Moon), so they are not comparable with the computed sites.
- `longest_sun_gap_hours` can exceed 24 and is cut at the start and end of 2027.
- Earth visibility is terrain-only line of sight. The Moon's orientation (libration) comes from Horizons' own geometry; we add nothing on top.
- Not validated against an independent tool such as LROC Quickmap. The only external check is the Connecting Ridge plausibility check above.

## 9. Credit lines (paste into `story/sources.md`)

- **NASA/JPL Horizons** (https://ssd.jpl.nasa.gov/horizons/, API https://ssd.jpl.nasa.gov/api/horizons.api). Used for the hourly azimuth and elevation of the Sun and Earth as seen from each site on the Moon for 2027 (ephemeris DE441, no refraction), and for the sub-solar and sub-Earth points and the Earth-Moon distance used for custom points and Earth's apparent size. Queried 14 November 2026 for the saved test responses; the committed data was built from queries made when each site was built.
- **LRO LOLA DEM v4, South Pole, via NASA Moon Trek** (https://trek.nasa.gov/moon/). Files `LRO_LOLA_DEM_SPole875_5mp_v04.tif` (5 m) and `LRO_LOLA_DEM_SPole75_30mp_v04.tif` (30 m). Used to compute the terrain horizon around each site (out to 150 km) and to read each site's elevation. The raw files are not in the repository. Related instrument page: https://science.nasa.gov/mission/lro/lola/ (background only).
- **LROC team page for the IM-2 landing site** (https://lroc.im-ldi.com/images/1401, Robinson, 26 Feb 2025). Used for the IM-2 intended landing coordinates (84.78 S, 29.13 E) in `im2-mons-mouton`.
- **Lunar Resources Registry south pole map** (https://lunarresourcesregistry.com/south-pole-map/). Third-party map. Used for the centre points of the three Artemis III candidate regions (Haworth, Malapert Massif, Nobile Rim 1) and of the Connecting Ridge. Not a NASA source; a region centre is not a landing spot.
- **Glaser et al. 2014**, Icarus 243, 78-90 (https://elib.dlr.de/94242). Used only as the published value for the Connecting Ridge plausibility check (92.27 percent sunlit at 2 m over 19 years). We did not copy data from it.
- **IAU Gazetteer of Planetary Nomenclature** (https://planetarynames.wr.usgs.gov, USGS Astrogeology). Used for crater centres: as starting points for `rim_search.py` (the README says via Wikipedia) and, per `story/sources.md` A03, for the crater outlines on the locator map. Not used for site coordinates of mission sites or for any Sun or Earth calculation.
- **LRO LOLA DEM v4 S Pole (30 m and 5 m), NASA Moon Trek**, used for the map hillshade (`public/data/basemap.png`, `basemap-87.5.png`, made by `data/basemap.py`).
- **Python tools:** numpy, rasterio and requests (listed in `data/requirements.txt`), and pytest for the tests. Licences not re-checked by this agent.
- AI use: the data scripts and this file were written with Claude Code (Anthropic). Whole team to state exact tools and uses in the AI disclosure.

## Not verified / still needs a human

- The "within about 70 m" result for `repick_pair.py` is gio's report. The repo has no record of it and the terrain files are not here, so I could not re-run it. I did confirm the committed pair equals the pair in `data/rim_candidates.json` (same lat/lon) and that the scan hours (7661 h) differ from `build.py` (7936 h) as stated.
- I did not open the Glaser et al. 2014 paper; 92.27 percent, 95.65 percent, 2 m, 10 m and 19 years come from the repo's test file and the task, not from me reading the paper. Whether it uses a point or a disc Sun is unconfirmed.
- I did not re-query Horizons or re-run `build.py` (no internet or terrain files here). The committed files are as built; I checked their internal consistency (lengths, 0/1 values, daily totals equal hourly sums) and that `public/data/sites.json` equals `data/sites.json`.
- "UT" in the Horizons responses is taken as UTC; the code does not set a time-zone option.
- Which terrain file each site used is from each site's `source` text. I did not recompute `pick_dem`.
- The 2 m "published studies use 2 m" statement is from the README and was not checked against the papers.
- The IM-2 coordinates and the Artemis III and Connecting Ridge centre coordinates were not re-checked against the LROC page or the registry map (no web access in this task).
- The licences of the third-party items (Moon Trek products, the registry map, Python libraries) are not checked. Re-read them before hand-in.
- The README lists the Gazetteer as read "through Wikipedia"; `story/sources.md` A03 says the USGS Gazetteer was read directly. Gio and koum should agree which is true before the credit is final.
