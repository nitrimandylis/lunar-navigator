# gio's answers for the story draft questions

These are gio's answers to the questions in the "TEAM NOTES AND QUESTIONS - DO NOT SUBMIT" sections of the story drafts. Koum copied each answer under its question in the drafts.
"Not yet confirmed" means gio has not confirmed it. Everything was checked from files only: the website was not run, nothing was rebuilt from Horizons or terrain, licences were not checked, and the IM-2 and registry pages were not re-fetched.

## story/notes/drafts/detailed-description.md

### story/notes/drafts/detailed-description.md > Questions about location/date selection - trim and gio - gio

Q: 1. Does entering coordinates or clicking the map analyse the exact point or select/snap to a prepared point?

Answer - gio/2026-11-14: From the code on main (035f289), not from a live test: typed coordinates and map clicks both use the exact point, and nothing snaps to a prepared point. A map click only fills the latitude and longitude fields (rounded to 2 decimals) and the user then presses Add site; clicking an existing pin selects that prepared site instead.

### story/notes/drafts/detailed-description.md > Questions about location/date selection - trim and gio - gio

Q: 2. Do custom points still use a smooth-Moon horizon without local terrain? How does the interface explain the difference?

Answer - gio/2026-11-14: Yes, in the code on main (035f289): a custom point gets Sun and Earth from ephemeris.json over a flat horizon at 0 degrees with no terrain. The interface says so (a 'no terrain' badge in the grid, 'Flat horizon, no terrain.' in the selected-site panel, and a note in the custom point form pointing to the prepared sites for terrain-aware numbers). Not checked in a running site.

### story/notes/drafts/detailed-description.md > Questions about location/date selection - trim and gio - gio

Q: 3. Which metrics are currently visible: Sun hours, Earth hours, simultaneous visibility, solar elevation, darkness gaps or other outputs?

Answer - gio/2026-11-14: Data side only: each prepared site file holds hourly Sun and Earth elevation, azimuth and visibility, a 360-value horizon, and per-UTC-day sun_hours, earth_hours, both_hours, max_sun_elev_deg and longest_sun_gap_hours. Which of these the interface shows: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about location/date selection - trim and gio - gio

Q: 4. What date/time inputs and intervals does the working interface support within the 2027 data? Do not infer arbitrary ranges from the hourly dataset.

Answer - gio/2026-11-14: Data side only: the data are hourly UTC samples for 2027 only (8760 per site, 2027-01-01 00:00 to 2027-12-31 23:00 UTC), with totals per UTC day, and nothing outside 2027. The date and time inputs and intervals the interface supports: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about location/date selection - trim and gio - gio

Q: 5. Once comparison is complete, can the website reproduce the exact May Shackleton example? Record a screenshot, app/data revision and verifier. A data-only metric must not be described as visible in the interface.

Answer - gio/2026-11-14: Data side only: recomputed from the committed public/data/sites/shackleton-ridge.json at main 035f289, May 2027 (744 h) gives Sun 512, Earth 457, both 436, with the 162 h dark spell from 14 May 06:00 to 21 May 00:00 UTC; shackleton-shadow gives 0, 0, 0. Reproduction in the website, with screenshot, revision and verifier: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about the planned AI feature - whole team - gio

Q: - What objective will define a preferred option: sunlight, Earth visibility, simultaneous availability, uninterrupted duration, user priorities or something else?

Answer - gio/2026-11-14: Not yet confirmed (team decision; Nick has said the criteria are undecided).

### story/notes/drafts/detailed-description.md > Questions about the planned AI feature - whole team - gio

Q: - What sites, coordinates, dates and time-window lengths can it search? Searching 18 prepared points would not establish a best location everywhere on the Moon.

Answer - gio/2026-11-14: Data side only: the committed data cover 18 prepared points and hourly 2027 only, and data/rim_search.py can scan terrain near craters offline (it needs the terrain files, which are not in git). The feature's actual search scope: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about the planned AI feature - whole team - gio

Q: - Does an actual numerical search compute the rankings, does an AI model explain them, or is another architecture planned? What provider/model and data inputs will be used?

Answer - gio/2026-11-14: Not yet confirmed (architecture, provider/model and inputs are not decided).

### story/notes/drafts/detailed-description.md > Questions about the planned AI feature - whole team - gio

Q: - How will terrain-aware and smooth-Moon results be handled so they are not silently ranked as equivalent?

Answer - gio/2026-11-14: Data side only: the two are not comparable, since custom points have no terrain horizon and the app already labels them 'no terrain'. How the AI feature would treat them: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about the planned AI feature - whole team - gio

Q: - How will the selected site/time, supporting numbers, constraints and limitations be checked against the underlying data?

Answer - gio/2026-11-14: Data side only: a suggestion for a prepared point could be checked against its committed hourly file, as in the reproduction script in data/FACTS-FOR-STORY.md section 6. The checking method for the feature itself: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about the planned AI feature - whole team - gio

Q: - What will it do when no option meets the requirements?

Answer - gio/2026-11-14: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about scientific evidence - gio - gio

Q: 1. Confirm the final data revision and May figures: 512 Sun hours, 457 Earth hours and 436 simultaneous hours out of 744, plus the ridge's 162-hour dark interval. Full year: 7,936 Sun hours out of 8,760.

Answer - gio/2026-11-14: Recomputed from the committed files at main 035f289 (14 November 2026): May 2027 (744 h) Sun 512, Earth 457, both 436; the longest dark spell is 162 h, from 14 May 06:00 to 21 May 00:00 UTC; full year Sun 7,936 of 8,760 (Earth 4,847, both 4,702). This checks the committed files only, was run by Claude Code, and did not rebuild from Horizons or the terrain. The final submission revision: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about scientific evidence - gio - gio

Q: 2. Which consistency or scientific checks have been rerun, by whom, on which revision and with what outcome?

Answer - gio/2026-11-14: In the repo: tests in data/tests, including test_public_data.py (committed files against sites.json) and test_known_answer.py, which .github/check.sh runs on every PR and on main; I did not look up individual run results. The recomputation above also found all 18 hourly files at 8760 samples. Which person reran what, on which revision: Not yet confirmed. No independent tool such as LROC Quickmap has been used.

### story/notes/drafts/detailed-description.md > Questions about scientific evidence - gio - gio

Q: 3. Has the original Glaser et al. paper been checked? F01's author did not reread it; the point and time span differ. Keep the numerical literature comparison out of the submission text until verified.

Answer - gio/2026-11-14: Not yet confirmed: the paper itself has not been read; only the DLR record page (https://elib.dlr.de/94242) and a search snippet were seen. The repo's check compares connecting-ridge, 7,994 h of Sun in 2027 (91.26%, 2 m, Sun as a disc), with their 92.27% (2 m, 19 years); it is a plausibility check only, the points and time spans differ, and the comparison should stay out of the submission text.

### story/notes/drafts/detailed-description.md > Questions about scientific evidence - gio - gio

Q: 4. Is there evidence for the reported terrain rerun within about 70 m? Do not add it as verified without a record.

Answer - gio/2026-11-14: Only the description of PR 36 (data/repick_pair.py), from an AI agent run, and it has not been independently re-run (the terrain files are not in the repo). That description gives 61 m for the lit point and 73 m for the dark point, 'within 100 m'; the 'about 70 m' wording is a looser summary of it, and the scan treats the Sun as a point (7,661 h against 7,936 h from build.py).

### story/notes/drafts/detailed-description.md > Questions about scientific evidence - gio - gio

Q: 5. Confirm UT/UTC treatment, terrain-product assignment, original coordinate sources and rights. Resolve any remaining documentation differences before quoting more precision.

Answer - gio/2026-11-14: UT/UTC: the saved Horizons responses print 'UT' and the code treats it as UTC; this is an assumption. Terrain product: from each site's source text, the 5 m file serves 6 sites (the Shackleton pair, de Gerlache, the Sverdrup pair, Connecting Ridge) and the 30 m file the other 12; build.pick_dem was not recomputed. Coordinates: IM-2 (84.78 S, 29.13 E) was read from https://lroc.im-ldi.com/images/1401 via a fetch tool and not independently rechecked; the Artemis III and Connecting Ridge centres come from a list gio pasted from the Lunar Resources Registry map, a page we did not fetch. Rights: licence not checked; the Gazetteer documentation difference is still open.

### story/notes/drafts/detailed-description.md > Questions about benefit and final copy - Nick and the team - gio

Q: - What are the final project/team names?

Answer - gio/2026-11-14: Not yet confirmed.

### story/notes/drafts/detailed-description.md > Questions about benefit and final copy - Nick and the team - gio

Q: - What are the final public links, permitted member credits and complete AI/asset disclosures?

Answer - gio/2026-11-14: Final public links and credits: Not yet confirmed. The data-side AI and asset inventory is in the AI use and Other references sections of submission-fields.md.

## story/notes/drafts/high-level-summary.md

### story/notes/drafts/high-level-summary.md > Questions corresponding to this summary - gio

Q: 1. **Nick/team:** What are the final project and team names?

Answer - gio/2026-11-14: Not yet confirmed.

### story/notes/drafts/high-level-summary.md > Questions corresponding to this summary - gio

Q: 4. **Team:** What will the AI optimise, over which sites and times, and how will its suggestions be checked? Until agreed, keep the cautious planned-feature wording.

Answer - gio/2026-11-14: Data side only: the committed data (18 prepared points, hourly 2027) and the offline scan scripts in data/ could support a search, but the criteria, sites, times and checking are not decided. Not yet confirmed (team decision).

## story/notes/drafts/submission-fields.md

### story/notes/drafts/submission-fields.md > Project identification - questions - gio

Q: - What are the final project/team names? Lunar Navigator is a working name in existing preparation documents, not a newly confirmed final name.

Answer - gio/2026-11-14: Not yet confirmed.

### story/notes/drafts/submission-fields.md > NASA data - questions and source limits - gio

Q: - **Gio:** confirm final data revision, exact product-access/download references, rights and build provenance.

Answer - gio/2026-11-14: Revision: main at 035f289 (PR 45) holds the current committed data; the final submission revision is Not yet confirmed. Products: LRO_LOLA_DEM_SPole875_5mp_v04.tif and LRO_LOLA_DEM_SPole75_30mp_v04.tif from NASA Moon Trek (https://trek.nasa.gov/moon/), exact download page and version link Not yet confirmed; Horizons via https://ssd.jpl.nasa.gov/api/horizons.api. Build provenance: each site file was made by data/build.py when that site was built, not in one run (PR 31 rebuilt the then-existing 13 sites at 2 m; im2-mons-mouton and the three artemis3 sites came in PR 32 and connecting-ridge in PR 33, each built individually; PR 37 re-scanned and moved haworth-candidate and amundsen-candidate). Rights: licence not checked.

### story/notes/drafts/submission-fields.md > NASA data - questions and source limits - gio

Q: - **Gio/trim:** do custom-coordinate/map-click points still lack local terrain horizons, or do they map to prepared points? The draft follows [F01](sources.md#f01) until corrected.

Answer - gio/2026-11-14: They are not mapped to prepared points: in the code on main (035f289) a typed or clicked point is analysed at its exact coordinates with Sun and Earth from ephemeris.json, a flat horizon and no terrain, and the interface labels it 'no terrain'. Not checked in a running site.

### story/notes/drafts/submission-fields.md > Other references - questions and source limits - gio

Q: - **Whole team:** were any additional space-agency partner datasets actually used? None is established in the reviewed evidence; complete the field accurately.

Answer - gio/2026-11-14: Data side only: the pipeline in data/ uses only Horizons and the LOLA terrain files, plus the LROC IM-2 page and the Lunar Resources Registry map for coordinates. The app side: Not yet confirmed.

### story/notes/drafts/submission-fields.md > Other references - questions and source limits - gio

Q: - **Gio:** recheck the original IM-2 and third-party region-centre coordinate references. A region centre is not a precise official landing point or a model of the entire region.

Answer - gio/2026-11-14: Not yet confirmed. The IM-2 coordinates (84.78 S, 29.13 E) were read from https://lroc.im-ldi.com/images/1401 via a fetch tool and not independently rechecked; the Artemis III centres come from a list gio pasted from the Lunar Resources Registry map, a page we did not fetch.

### story/notes/drafts/submission-fields.md > Other references - questions and source limits - gio

Q: - **Gio/trim:** reconcile Gazetteer access paths for the separate uses. [A03](sources.md#a03) reports direct Gazetteer use for locator outlines; F01 reports scan starting points through Wikipedia.

Answer - gio/2026-11-14: Both statements can be true for separate uses: data/README.md says the crater centres used as starting points for rim_search.py were taken from the IAU Gazetteer 'read through Wikipedia', and A03 says trim read the USGS Gazetteer directly for the locator map outlines. Whether the Wikipedia-read numbers were rechecked against the Gazetteer: Not yet confirmed.

### story/notes/drafts/submission-fields.md > Other references - questions and source limits - gio

Q: - **Gio:** check the original Glaser paper before quoting literature values as verified. F01's author did not reread it. The draft gives the reference without claiming replication or a verified accuracy percentage.

Answer - gio/2026-11-14: Not yet confirmed: the paper itself has not been read, only the DLR record page (https://elib.dlr.de/94242) and a search snippet. The repo's comparison (7,994 h = 91.26% for connecting-ridge against their 92.27%) is a plausibility check, not a replication.

### story/notes/drafts/submission-fields.md > Other references - questions and source limits - gio

Q: - **Whole team:** complete the map imagery, icon, library and other resource inventory with exact links and applicable rights. No 3D Moon asset is assumed; the 3D feature is removed from scope.

Answer - gio/2026-11-14: Data-side resources: NASA/JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api); LRO LOLA DEM v4 South Pole, 5 m and 30 m, from NASA Moon Trek (https://trek.nasa.gov/moon/); Python packages requests, numpy and rasterio (data/requirements.txt, plus pytest for tests); the LROC IM-2 page (https://lroc.im-ldi.com/images/1401); the Lunar Resources Registry south pole map (https://lunarresourcesregistry.com/south-pole-map/); the Glaser et al. 2014 abstract record (https://elib.dlr.de/94242). Licence not checked for any of them. The app-side inventory: Not yet confirmed.

### story/notes/drafts/submission-fields.md > AI use - questions and final checks - gio

Q: - **Trim/gio/whole team:** what exact tools and model names were used, for which tasks, and what human checking was actually completed?

Answer - gio/2026-11-14: Data-side AI use: Claude Code (model Claude Sonnet 5.5, id claude-sonnet-5-5) was used to write and run the pipeline code, tests, docs, terrain scans, summaries and pull requests; most commit messages carry a Co-Authored-By trailer naming it. A GitHub Actions workflow (.github/workflows/review.yml) also has Claude Code review each pull request with the model alias 'opus'; the exact model version is not stated there. Human checking of the AI output by gio: Not yet confirmed. No generated images, video or audio on the data side.

### story/notes/drafts/submission-fields.md > AI use - questions and final checks - gio

Q: - **Team:** what does the planned AI feature actually search or calculate, with which inputs, criteria and provider/model? Its presence in the final project must be reflected in the final tool inventory and disclosure.

Answer - gio/2026-11-14: Data side only: the committed data (18 prepared points, hourly 2027) and the offline scan scripts could support a search, but the criteria, scope, inputs and provider/model are not decided. Not yet confirmed (team decision).

### story/notes/drafts/submission-fields.md > AI use - questions and final checks - gio

Q: - Complete any applicable visible acknowledgements and metadata for generated code/data. Inventory any generated images, video or audio and follow [N02 p. 8](sources.md#n02).

Answer - gio/2026-11-14: Data side only: no generated images, video or audio. Metadata for the generated code and data: Not yet confirmed.

### story/notes/drafts/submission-fields.md > Public links - questions and final checks - gio

Q: - What are the team's website and NASA project-page URLs?

Answer - gio/2026-11-14: Not yet confirmed.
