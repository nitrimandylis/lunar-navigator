# Detailed project description - working draft

> **DRAFT - preparation only. Not approved for submission.**

Updated: 14 November 2026, following Nick's feature-status clarification.
Only the text between **DRAFT TEXT - START** and **END OF DRAFT TEXT** is proposed submission wording. All team questions, source-review caveats and rubric notes are below that boundary. [PROJECT NAME] remains a placeholder.

---

## DRAFT TEXT - START

### The problem and our intended users

A lunar location needs to be considered together with a time window. Sunlight availability and a view of Earth can differ between nearby points and across the year. A high annual sunlight percentage can also conceal a long continuous period of darkness. Understanding these differences is relevant when exploring opportunities for solar power and direct-to-Earth communication, although visibility alone cannot establish whether either system will work.

We are developing [PROJECT NAME] as a website for exploring these site-and-date conditions at the lunar south pole. Our intended users are educators and the public who want an understandable explanation, and mission planners and other space professionals who want more detailed information for an initial comparison.

### Available location and date selection

Users can select a site and change the date. A location can also be chosen by entering exact coordinates or clicking a point on the lunar map. This provides an entry point for exploring a location and its conditions at a chosen time.

The prepared site dataset contains 18 points, each with 8,760 hourly samples covering 2027 and corresponding daily summaries. Location selection and the scientific coverage of a selected point are separate: the documented method uses terrain horizons for these prepared points, while custom-point estimates use a smooth-Moon horizon without local terrain obstruction. Results from those two methods need to be distinguished.

### Planned comparison, interface levels and AI feature

Side-by-side site comparison is planned so that users can inspect different locations over the same time window. We also plan a simpler interface for educators and the public, alongside a more detailed interface for professional users. The intended difference is the level of information and explanation, rather than a claim of NASA endorsement or professional certification.

An AI feature is also planned to help identify promising locations and time windows. The criteria for a best option, the search coverage and the verification method are still being defined. The feature is not yet presented as an implemented or validated optimiser, and a suggestion would not by itself establish landing safety.

### A prepared-data example: nearby locations, different conditions

Two team-computed points near Shackleton, shackleton-ridge and shackleton-shadow, are about 2.1 km apart. Both use a 2 m observer height above the local ground and the same terrain-aware visibility method. They are points selected by the team's scan, rather than official mission landing sites.

For May 2027, the model's hourly samples run from 1 May at 00:00 through 31 May at 23:00 UTC, covering 744 hours:

| Modelled quantity | Lit ridge near Shackleton | Shadowed point near Shackleton |
| --- | --- | --- |
| Sun visible | 512 h / 744 h (68.8%) | 0 h |
| Earth visible | 457 h / 744 h (61.4%) | 0 h |
| Sun and Earth visible at the same hourly sample | 436 h / 744 h (58.6%) | 0 h |
| Longest continuous Sun gap in this month | 162 h (6.75 days) | All 744 h |

Across the full year, the ridge has sunlight at 7,936 of 8,760 hourly samples (90.6%). Its 162-hour dark interval falls in May. The shadowed point has no modelled Sun or Earth visibility at the sampled times throughout 2027.

These [prepared-data results](https://github.com/nitrimandylis/lunar-navigator/blob/c99fb3df081aca91e54ac95b57e66b12fdeac194/data/FACTS-FOR-STORY.md#6-one-reproducible-comparison-the-shackleton-litdark-pair) illustrate why both location and time matter: nearby points can have very different conditions, and annual totals do not reveal the timing or length of every interruption. The example currently establishes a comparison in the data; the side-by-side website comparison is still planned.

### How NASA data enables the result

The calculation combines two kinds of NASA information. [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) supplies the hourly directions of the Sun and Earth as seen from the lunar points. Saved responses identify the DE441 ephemeris and use no atmospheric refraction. The team's files treat the reported times as UTC.

LRO LOLA south pole digital elevation models, obtained through [NASA Moon Trek](https://trek.nasa.gov/moon/), supply the terrain. The documented version 4 products have 5 m and 30 m pixels. The horizon calculation uses detailed terrain within 25 km and more coarsely sampled terrain out to 150 km, allowing for lunar curvature. It builds a skyline in 360 directions at one-degree azimuth steps, viewed from 2 m above the ground.

The team compares the Sun and Earth with that skyline. A body is classed as visible at an hourly sample if any part of its apparent disc clears the terrain horizon, using a 25-point disc approximation. Hourly values are summed to produce visibility totals; continuous periods without sunlight are also recorded.

NASA supplies the positions and terrain inputs. The team's processing produces the visibility estimates used to explore site-and-time conditions.

### Checks and confidence

The data handoff reports internal consistency checks across all 18 prepared points: each hourly array contains 8,760 entries, visibility values are binary, there are no null values, and daily visibility sums agree with the hourly files. In that dataset, a zero represents blocked visibility rather than missing data.

These checks support internal consistency; they do not independently establish physical accuracy. Further independent scientific comparison and observed usability feedback would strengthen confidence. Professional adoption, measured educational outcomes and improvements in task speed have not been established by the evidence used for this draft.

### Intended contribution and current limits

The intended contribution is a clear workflow connecting a location, a time window, the resulting conditions and their explanation. For education, the Shackleton example can help explain how terrain and timing affect the view of the Sun and Earth. For preliminary mission exploration, presenting sunlight and Earth visibility separately makes those different conditions explicit. The planned interface levels and AI feature are intended to support those uses; their benefit still needs to be demonstrated.

The model's scope remains bounded:

- The prepared site dataset covers 2027 only, at one-hour intervals. Shorter events are not resolved, and each sampled hour counts fully toward a total.
- Sun visibility does not calculate electrical generation, battery capacity or thermal conditions. Earth visibility does not calculate radio link performance, antenna pointing or the visibility of a particular ground station.
- The terrain skyline is a finite-resolution approximation. Terrain errors are not propagated, and the model uses a fixed 2 m observer height.
- Custom-point estimates in the documented method lack the local terrain treatment of the 18 prepared points.
- Team-computed points are not official NASA landing candidates. Mission-related entries represent individual points, rather than a model of a whole candidate region.
- Neither the current visibility indicators nor the planned AI suggestions establish a complete assessment of landing safety.

### Next steps

The immediate development goals are to complete comparison, the two interface levels and the proposed AI feature, with explicit search criteria and verification for any recommendations. Before submission, we also need to reproduce the chosen example in the final interface, complete the source and AI-use records, and update this description to match the finished website.

## END OF DRAFT TEXT

---

## TEAM NOTES AND QUESTIONS - DO NOT SUBMIT

**Everything below this heading is preparation material, not part of the project description.**

### Status basis

[Nick's update F02](../sources.md#f02) is the basis for the interface account. It confirms site selection and date changes as working, describes coordinate entry and map clicking, removes the 3D Moon, and identifies comparison, audience-specific interfaces and the AI feature as planned. Nick confirmed that AI selection criteria are still being decided. This writing task has not independently tested the website.

[Gio's handoff F01](../sources.md#f01) is the basis for calculations and results. It is owner-reported implementation evidence, not NASA certification. Its own unverified items still apply. If the implementation has changed since that snapshot, update the relevant claims before approving the draft.

### Questions about location/date selection - trim and gio

1. Does entering coordinates or clicking the map analyse the exact point or select/snap to a prepared point?

   Answer - gio/2026-11-14: From the code on main (035f289), not from a live test: typed coordinates and map clicks both use the exact point, and nothing snaps to a prepared point. A map click only fills the latitude and longitude fields (rounded to 2 decimals) and the user then presses Add site; clicking an existing pin selects that prepared site instead.
2. Do custom points still use a smooth-Moon horizon without local terrain? How does the interface explain the difference?

   Answer - gio/2026-11-14: Yes, in the code on main (035f289): a custom point gets Sun and Earth from ephemeris.json over a flat horizon at 0 degrees with no terrain. The interface says so (a 'no terrain' badge in the grid, 'Flat horizon, no terrain.' in the selected-site panel, and a note in the custom point form pointing to the prepared sites for terrain-aware numbers). Not checked in a running site.
3. Which metrics are currently visible: Sun hours, Earth hours, simultaneous visibility, solar elevation, darkness gaps or other outputs?

   Answer - gio/2026-11-14: Data side only: each prepared site file holds hourly Sun and Earth elevation, azimuth and visibility, a 360-value horizon, and per-UTC-day sun_hours, earth_hours, both_hours, max_sun_elev_deg and longest_sun_gap_hours. Which of these the interface shows: Not yet confirmed.
4. What date/time inputs and intervals does the working interface support within the 2027 data? Do not infer arbitrary ranges from the hourly dataset.

   Answer - gio/2026-11-14: Data side only: the data are hourly UTC samples for 2027 only (8760 per site, 2027-01-01 00:00 to 2027-12-31 23:00 UTC), with totals per UTC day, and nothing outside 2027. The date and time inputs and intervals the interface supports: Not yet confirmed.
5. Once comparison is complete, can the website reproduce the exact May Shackleton example? Record a screenshot, app/data revision and verifier. A data-only metric must not be described as visible in the interface.

   Answer - gio/2026-11-14: Data side only: recomputed from the committed public/data/sites/shackleton-ridge.json at main 035f289, May 2027 (744 h) gives Sun 512, Earth 457, both 436, with the 162 h dark spell from 14 May 06:00 to 21 May 00:00 UTC; shackleton-shadow gives 0, 0, 0. Reproduction in the website, with screenshot, revision and verifier: Not yet confirmed.

### Questions about the planned interfaces - Nick and trim

1. Which information and controls will the public/educator view show?
2. Which additional information will the professional view show?
3. What actual difference will help each audience complete its task? A role selector alone does not demonstrate a benefit.
4. Keep professional audience labels neutral. A label such as professional or mission planner does not imply NASA endorsement.

### Questions about the planned AI feature - whole team

Nick has confirmed that the selection criteria are undecided. The draft deliberately does not promise a global best site, an implemented scoring formula or a validated optimisation result.

- What objective will define a preferred option: sunlight, Earth visibility, simultaneous availability, uninterrupted duration, user priorities or something else?

  Answer - gio/2026-11-14: Not yet confirmed (team decision; Nick has said the criteria are undecided).
- What sites, coordinates, dates and time-window lengths can it search? Searching 18 prepared points would not establish a best location everywhere on the Moon.

  Answer - gio/2026-11-14: Data side only: the committed data cover 18 prepared points and hourly 2027 only, and data/rim_search.py can scan terrain near craters offline (it needs the terrain files, which are not in git). The feature's actual search scope: Not yet confirmed.
- Does an actual numerical search compute the rankings, does an AI model explain them, or is another architecture planned? What provider/model and data inputs will be used?

  Answer - gio/2026-11-14: Not yet confirmed (architecture, provider/model and inputs are not decided).
- How will terrain-aware and smooth-Moon results be handled so they are not silently ranked as equivalent?

  Answer - gio/2026-11-14: Data side only: the two are not comparable, since custom points have no terrain horizon and the app already labels them 'no terrain'. How the AI feature would treat them: Not yet confirmed.
- How will the selected site/time, supporting numbers, constraints and limitations be checked against the underlying data?

  Answer - gio/2026-11-14: Data side only: a suggestion for a prepared point could be checked against its committed hourly file, as in the reproduction script in data/FACTS-FOR-STORY.md section 6. The checking method for the feature itself: Not yet confirmed.
- What will it do when no option meets the requirements?

  Answer - gio/2026-11-14: Not yet confirmed.

These are questions for defining and describing the feature, not claims that those capabilities exist.

### Questions about scientific evidence - gio

1. Confirm the final data revision and May figures: 512 Sun hours, 457 Earth hours and 436 simultaneous hours out of 744, plus the ridge's 162-hour dark interval. Full year: 7,936 Sun hours out of 8,760.

   Answer - gio/2026-11-14: Recomputed from the committed files at main 035f289 (14 November 2026): May 2027 (744 h) Sun 512, Earth 457, both 436; the longest dark spell is 162 h, from 14 May 06:00 to 21 May 00:00 UTC; full year Sun 7,936 of 8,760 (Earth 4,847, both 4,702). This checks the committed files only, was run by Claude Code, and did not rebuild from Horizons or the terrain. The final submission revision: Not yet confirmed.
2. Which consistency or scientific checks have been rerun, by whom, on which revision and with what outcome?

   Answer - gio/2026-11-14: In the repo: tests in data/tests, including test_public_data.py (committed files against sites.json) and test_known_answer.py, which .github/check.sh runs on every PR and on main; I did not look up individual run results. The recomputation above also found all 18 hourly files at 8760 samples. Which person reran what, on which revision: Not yet confirmed. No independent tool such as LROC Quickmap has been used.
3. Has the original Glaser et al. paper been checked? F01's author did not reread it; the point and time span differ. Keep the numerical literature comparison out of the submission text until verified.

   Answer - gio/2026-11-14: Not yet confirmed: the paper itself has not been read; only the DLR record page (https://elib.dlr.de/94242) and a search snippet were seen. The repo's check compares connecting-ridge, 7,994 h of Sun in 2027 (91.26%, 2 m, Sun as a disc), with their 92.27% (2 m, 19 years); it is a plausibility check only, the points and time spans differ, and the comparison should stay out of the submission text.
4. Is there evidence for the reported terrain rerun within about 70 m? Do not add it as verified without a record.

   Answer - gio/2026-11-14: Only the description of PR 36 (data/repick_pair.py), from an AI agent run, and it has not been independently re-run (the terrain files are not in the repo). That description gives 61 m for the lit point and 73 m for the dark point, 'within 100 m'; the 'about 70 m' wording is a looser summary of it, and the scan treats the Sun as a point (7,661 h against 7,936 h from build.py).
5. Confirm UT/UTC treatment, terrain-product assignment, original coordinate sources and rights. Resolve any remaining documentation differences before quoting more precision.

   Answer - gio/2026-11-14: UT/UTC: the saved Horizons responses print 'UT' and the code treats it as UTC; this is an assumption. Terrain product: from each site's source text, the 5 m file serves 6 sites (the Shackleton pair, de Gerlache, the Sverdrup pair, Connecting Ridge) and the 30 m file the other 12; build.pick_dem was not recomputed. Coordinates: IM-2 (84.78 S, 29.13 E) was read from https://lroc.im-ldi.com/images/1401 via a fetch tool and not independently rechecked; the Artemis III and Connecting Ridge centres come from a list gio pasted from the Lunar Resources Registry map, a page we did not fetch. Rights: licence not checked; the Gazetteer documentation difference is still open.

### Questions about benefit and final copy - Nick and the team

- What are the final project/team names?

  Answer - gio/2026-11-14: Not yet confirmed.
- Has anyone outside the development team tried the site? If yes, record the task, participant type, date, observed result and feedback. No such result is assumed here.
- What is the strongest demonstrated improvement in our workflow? Any faster/easier claim needs actual evidence.
- Which planned features were completed by submission time? Move only confirmed functions into the available-features section.
- What are the final public links, permitted member credits and complete AI/asset disclosures?

  Answer - gio/2026-11-14: Final public links and credits: Not yet confirmed. The data-side AI and asset inventory is in the AI use and Other references sections of submission-fields.md.

### Review against NASA's rubric

These are editorial notes, not extra form fields or predicted scores. [N01](../sources.md#n01), pp. 5-7, governs the five criteria; no percentage weights or winning odds are assumed.

| Criterion | Evidence available | Remaining gap |
| --- | --- | --- |
| Impact | A defined site/time question and a meaningful prepared-data example | Observed benefit for an intended user; otherwise keep benefit as intended |
| Creativity | Planned comparison, differentiated interfaces and AI-supported site/time exploration | Show the specific completed improvement; planned features do not prove novelty or effectiveness |
| Validity | Reported consistency checks, explicit method and limits | Final revision check, appropriate independent comparison, usability evidence and AI recommendation verification |
| Relevance | Horizons and LOLA directly drive Sun/Earth conditions | Demonstrate that chain in the completed workflow |
| Presentation | Clear separation of available work, planned features, evidence and scope | Readable final screenshots and consistent final summary, description and deck |

### Source and writing key

- [N01](../sources.md#n01), pp. 5-7: judging criteria.
- [N02](../sources.md#n02), pp. 6-9: description prompts, data and disclosures.
- [N06](../sources.md#n06): official challenge objective and audiences. Full suggestions were previously reviewed through the lower-authority [L01](../sources.md#l01).
- [T01](../sources.md#t01): Horizons documentation as system background.
- [F01](../sources.md#f01), sections 1-8: data/methods, consistency checks, site provenance, comparison and limits. Section 9 and the final unverified list support the outstanding credit/evidence questions.
- [F02](../sources.md#f02): Nick's current feature/status report and undecided AI criteria.
- [Submission-page guide](../submission-page-guide.md) and [research strategies](../winning-strategies.md): clear problem, actual evidence and consistency, including credited P01-P02 communication advice. No previous participant's wording, concept or results are used as ours.
