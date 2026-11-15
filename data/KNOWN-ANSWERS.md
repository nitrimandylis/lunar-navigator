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

## Method differences

- Time: Glaser simulate 19 years (1 hour steps; they say it exceeds the 18.6-year cycle); we simulate 2027 only.
- Sun: Glaser treat the Sun as a disc (the abstract says so), as we do. "Lit" (92.3 %, 95.66 %) is time with any sunlight; "average illumination" (87.9 %, 92.5 %) is a different, lower quantity that weights partial Sun. Ours is the "lit" definition.
- Observer height: 2 m and 10 m above ground in both.
- DEM: Glaser 20 m per pixel LOLA DTM (adjusted tracks); ours the NASA Moon Trek LOLA DEM v4 at 5 m.
- Mazarico 2011 used 240 m maps, surface level (height 0), hourly steps over 18.6 years, Sun as a disc (NASA PGDA product page). Surface level and 240 m are not comparable to our 2 m / 5 m or 30 m numbers anyway.

## What this proves, and what it does not

It shows our horizon and Sun-position code lands within a point of an independent, published
simulation at 10 m height at two points. It does not prove the 2 m numbers: they disagree by 5 to 8
points at Glaser's two 2 m spots, and one year is not 19 years. Malapert is untested.

## Notes on sources

`https://elib.dlr.de/94242` is the **EPSC 2014 abstract** (EPSC2014-136), not the Icarus paper. The
Icarus paper is elib 94240; its abstract (92.27 % at 2 m, 95.65 % at 10 m) was readable, its full
text was not. The page range is 78-90 (ADS) or 79-90 (DLR). The EPSC abstract rounds to 92.3 % and 95.66 %.

## Citation block for story/sources.md

- Gläser, P., Scholten, F., De Rosa, D., Figuera, R. M., Oberst, J., Mazarico, E., Neumann, G. A., Robinson, M. S. (2014). Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA. Icarus 243, 78-90. https://doi.org/10.1016/j.icarus.2014.08.013 (abstract: https://elib.dlr.de/94240)
- Gläser, P., et al. (2014). Connecting Ridge - A landing site at the lunar south pole with extended illumination. EPSC Abstracts 9, EPSC2014-136-1. https://elib.dlr.de/94242 (PDF: https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf)
- Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T., Torrence, M. H. (2011). Illumination conditions of the lunar polar regions using LOLA topography. Icarus 211, 1066-1081. https://doi.org/10.1016/j.icarus.2010.10.030 (abstract: https://ntrs.nasa.gov/citations/20120010094; product: https://pgda.gsfc.nasa.gov/products/69)
