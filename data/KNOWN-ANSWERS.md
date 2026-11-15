# Known-answer check: our Sun % against published values

Our number: share of the 8760 hours of 2027 in which any part of the Sun's disc is above the
terrain horizon, from an observer 2 m above ground unless stated (`data/FACTS-FOR-STORY.md`).

| Point | Our Sun % | Published | Source | Verdict |
|-------|-----------|-----------|--------|---------|
| Connecting Ridge, our best-lit point (-89.4739, -137.3158), 2 m | 91.26 | 92.27 % lit, 2 m | Glaser 2014 (Icarus abstract) | Close (their exact point has no coordinates in the abstract, so we compare against the best point we found) |
| Glaser spot 4 (-89.4544, -137.1555), 10 m | 95.97 | 95.66 % lit (abstract of the Icarus paper: 95.65) | Glaser 2014, EPSC abstract (coordinates) | Match within 0.3 points. Pinned by `test_glaser_2014_spot4_sunlit_percent_at_10m` (tolerance 3 points) |
| Glaser spot 3 (-89.4516, -137.2419), 10 m | 95.95 | 95.6 % lit (92.5 % average illumination) | Glaser 2014, EPSC abstract | Match within 0.4 points |
| Glaser spot 2 (-89.4399, -137.1476), 2 m | 86.66 | 92.3 % lit (87.9 % average illumination) | Glaser 2014, EPSC abstract | Ours is 5.6 points lower |
| Glaser spot 1 (-89.4395, -137.1934), 2 m | 83.92 | 92 % lit (88.1 % average illumination) | Glaser 2014, EPSC abstract | Ours is 8 points lower |
| Malapert massif / peak | 51.1 (`malapert-candidate`), 58.0 (`artemis3-malapert-massif`) | **not confirmed** | Mazarico 2011 full text and tables could not be read (paywalled, 403) | No comparison made. A secondary source (Kring 2025, JGR Planets, seen only in a search snippet) mentions about 82 % for the summit; we did not read it, so it is not used |
| Shackleton rim / de Gerlache rim | not computed | **not confirmed** | Mazarico 2011 abstract only says one Shackleton-rim site is "sunlit continuously for 240 days"; no percentage and no coordinates | No comparison made |

Spot coordinates are Glaser's, converted from degrees East 0 to 360 (222.8445 E = -137.1555). The
two 2 m spots are the worst matches: those percentages are maxima over a 20 m grid, are very
sensitive at 2 m, and their coordinates are rounded to 0.0001 degrees (about 3 m). Our result at a
given point can differ from theirs by several points just from where the pixel centre falls.

## Maximum over a 20 m neighbourhood (does not close the 2 m gap)

Glaser et al. report maxima on a 20 m grid, so their number may belong to a better pixel than the
one at their coordinates. We recomputed our 2027 Sun % (same rule: any part of the disc above the
horizon, hourly, 5 m LOLA v4 DEM, 2 m observer for spots 1-2 and 10 m for spots 3-4) at every 5 m
DEM pixel centre near each published point, each with its own full horizon (25 km at 5 m plus the
30 m DEM out to 150 km, as in `build.py`). Script: `data/known_answers_neighbourhood.py`; raw
results: `data/known_answers_neighbourhood.json`. The Sun direction is taken from Horizons at the
published point and reused for the neighbours (it moves by under 0.001 degrees over 40 m). The
point row reproduces the committed 83.92 / 86.66 / 95.95 / 95.97 exactly.

Neighbourhood: all pixel centres within 10 m of the published point (a 20 m diameter disc, 12-13
pixels), the main row. The 20 m x 20 m square (centres within 10 m in both axes, 16 pixels) and
two 40 m variants (disc r 20 m, 52 pixels; square, 64 pixels) are for sensitivity.

| Spot (height) | Published | Ours at point | Ours, max in 20 m disc | Mean in 20 m disc | Gap before | Gap after |
|---|---|---|---|---|---|---|
| 1 (2 m) | 92.0 | 83.92 | 86.67 (7.0 m E, 6.9 m N of the point) | 83.78 | 8.1 | 5.3 |
| 2 (2 m) | 92.3 | 86.66 | 87.23 (8.7 m E, 3.8 m N) | 85.44 | 5.6 | 5.1 |
| 3 (10 m) | 95.6 | 95.95 | 96.05 (2.3 m E, 7.7 m S) | 95.87 | -0.4 | -0.5 |
| 4 (10 m) | 95.66 | 95.97 | 96.04 (8.0 m E, 2.0 m S) | 95.90 | -0.3 | -0.4 |

Gap is published minus ours (negative: ours is higher). Sensitivity of the maximum:

| Spot | 20 m square (16 px) | 40 m disc (52 px) | 40 m square (64 px) |
|---|---|---|---|
| 1 | 86.67 | 87.32 | 87.47 |
| 2 | 87.23 | 90.45 | 90.45 |
| 3 | 96.05 | 96.05 | 96.05 |
| 4 | 96.05 | 96.14 | 96.14 |

**Does it close the gap? No.** Taking the best pixel in 20 m moves spot 1 up 2.8 points and spot 2
up 0.6, leaving 5.3 and 5.1 points short. Spots 3 and 4 were already within 0.4 points and move by
about 0.1. Only the 40 m variants get spot 2 close (90.45, 1.9 short), and that is a neighbourhood
twice as wide as the one Glaser describe; at spot 1 even 40 m leaves 4.5 points. The 40 m spot 2
maximum should not be read as support: the same 40 m area also contains pixels as low as 16.5 %
(a pit or crater floor), so the 2 m result varies by tens of points over short distances here.

Likely other causes, not tested here:

- DEM resolution: Glaser used a 20 m DTM, ours is 5 m. A coarser grid smooths small ridges and
  hollows within a few tens of metres of a 2 m observer, which could raise their lit share
  relative to ours. We cannot check the size or direction of that effect without their DTM.
- Time span: 19 years against our 2027. Spots 3 and 4 agree to within 0.4 points with the same
  one-year/19-year difference, so this alone is unlikely to explain 5 points, but it is not ruled out.
- Coordinate rounding (0.0001 degrees, about 3 m) is covered by this neighbourhood test, so it does
  not explain the gap.
- Definition: published values are "lit" percentages (any sunlight); the "average illumination"
  numbers are lower (88.1 and 87.9) and happen to be close to ours (83.9 and 86.7 at the point, 86.7
  and 87.2 at the best pixel). We believe the 92 / 92.3 figures are the "lit" definition and have
  not confirmed it beyond the EPSC abstract wording.

## Method differences

- Time: Glaser simulate 19 years (1 hour steps; they say it exceeds the 18.6-year cycle); we simulate 2027 only.
- Sun: Glaser treat the Sun as a disc (the abstract says so), as we do. "Lit" (92.3 %, 95.66 %) is time with any sunlight; "average illumination" (87.9 %, 92.5 %) is a different, lower quantity that weights partial Sun. Ours is the "lit" definition.
- Observer height: 2 m and 10 m above ground in both.
- DEM: Glaser 20 m per pixel LOLA DTM (adjusted tracks); ours the NASA Moon Trek LOLA DEM v4 at 5 m.
- Mazarico 2011 used 240 m maps, surface level (height 0), hourly steps over 18.6 years, Sun as a disc (NASA PGDA product page). Surface level and 240 m are not comparable to our 2 m / 5 m or 30 m numbers anyway.

## What this proves, and what it does not

It shows our horizon and Sun-position code lands within a point of an independent, published
simulation at 10 m height at two points. It does not prove the 2 m numbers: they disagree by 5 to 8
points at Glaser's two 2 m spots (still 5 points after taking the best pixel within 20 m, see above), and one year is not 19 years. Malapert is untested.

## Notes on sources

`https://elib.dlr.de/94242` is the **EPSC 2014 abstract** (EPSC2014-136), not the Icarus paper. The
Icarus paper is elib 94240; its abstract (92.27 % at 2 m, 95.65 % at 10 m) was readable, its full
text was not. The page range is 78-90 (ADS) or 79-90 (DLR). The EPSC abstract rounds to 92.3 % and 95.66 %.

## Citation block for story/sources.md

- Gläser, P., Scholten, F., De Rosa, D., Figuera, R. M., Oberst, J., Mazarico, E., Neumann, G. A., Robinson, M. S. (2014). Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA. Icarus 243, 78-90. https://doi.org/10.1016/j.icarus.2014.08.013 (abstract: https://elib.dlr.de/94240)
- Gläser, P., et al. (2014). Connecting Ridge - A landing site at the lunar south pole with extended illumination. EPSC Abstracts 9, EPSC2014-136-1. https://elib.dlr.de/94242 (PDF: https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf)
- Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T., Torrence, M. H. (2011). Illumination conditions of the lunar polar regions using LOLA topography. Icarus 211, 1066-1081. https://doi.org/10.1016/j.icarus.2010.10.030 (abstract: https://ntrs.nasa.gov/citations/20120010094; product: https://pgda.gsfc.nasa.gov/products/69)
