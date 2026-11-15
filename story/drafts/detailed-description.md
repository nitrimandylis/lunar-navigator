# Detailed project description - revised working draft

> **DRAFT - preparation only. Not approved for submission.**

Revised: 15 November 2026. Evidence snapshot: 10aa615, with Nick's latest coverage confirmation. The name follows the current app title.
Only the section between **DRAFT TEXT - START** and **END OF DRAFT TEXT** is proposed submission wording. Questions, evidence details and rubric notes follow the boundary.

---

## DRAFT TEXT - START

### The right place also needs the right time

A lunar location cannot be understood from a map position or an annual sunlight percentage alone. A solar-powered mission needs to know when sunlight is available, how long darkness lasts and when Earth is visible for a possible direct radio link. Those conditions can change sharply between nearby points and over time.

Lunar Landing Site Navigator connects a table of locations and dates, a physical explanation of Sun and Earth visibility, and a mission planner that checks conditions throughout a proposed stay. Its intended users are educators and the public exploring lunar conditions, and space professionals examining preliminary site-and-time options.

The challenge identifies complicated interfaces as a barrier to evaluating existing information. Our contribution brings three tasks into one connected workflow: compare availability, see why a horizon blocks the Sun or Earth, and check whether a proposed stay meets explicit requirements. An educator can use that connection to explain lunar conditions; a planner can inspect the assumptions behind an initial shortlist.

### Compare locations in the same table

The table is the comparison tool. Prepared sites are shown against the same month, with separate sunlight and Earth-visibility lanes. Users can open a day to inspect its hours and sort the prepared sites by:

- **Power:** most hours with some sunlight.
- **Comms:** most hours with Earth visible.
- **Both:** most hours when the Sun and Earth are visible together.

This makes the ranking interpretable. A site at the top of Power has the most modelled sunlight hours for that month; the label does not establish electrical output or landing safety.

Selecting a site and hour updates a horizon panorama showing the Sun and Earth against the skyline, charts showing how far each body clears the terrain, and rise/set countdowns. Playback and a slider show how conditions evolve. These linked views give the changing numbers a physical explanation.

The selected-site card also provides terrain context: slope estimated from a 30 m LOLA grid, distance to the nearest mapped permanently shadowed region larger than 1 square kilometre, and a separate comparison of sunlight at 2 m and 10 m observer heights. The height comparison currently summarizes 2027-2030; it is distinct from the longer hourly dataset. These indicators help users ask more specific questions about a point; they are not combined into a universal suitability score.

Users can choose a prepared site, enter coordinates, or click empty ground on the polar map and add that point. Custom locations are evaluated at those coordinates on a smooth Moon without local terrain, and are labelled and grouped separately. Five past landing locations provide context using the same modelled future dates. These smooth-horizon examples are not ranked against the terrain-aware south pole points.

### Check the mission's whole stay

The mission planner asks which prepared locations have an arrival time meeting the user's stated requirements.

Users set length of stay, minimum fractions of that stay with Sun and Earth visibility, and maximum continuous darkness. Editable presets are starting assumptions, not agency-certified mission requirements.

The planner checks candidate arrival hours, including sunlight at arrival and enough remaining data for the whole stay. It ranks terrain-aware sites by the number of days containing at least one qualifying arrival hour. It also shows the next qualifying time and a timeline of eligible days. A day-level slip margin indicates how far the selected date can move within the same run of eligible days. This describes flexibility within the visibility-based arrival window, not a launch-trajectory calculation.

The search is an explicit numerical calculation. Its results can be traced to the requirements and hourly data; the current ranking does not depend on an AI-generated recommendation.

### A decision the calculation can explain

Consider the editable Short lander preset: a 14-day stay, at least 80% of its hours with Sun visible, at least 50% with Earth visible, no continuous darkness longer than 24 hours, and sunlight at arrival. These are illustrative planning assumptions, not requirements certified by NASA or a spacecraft operator.

For arrival at 00:00 UTC on 1 May 2027, the 336-hour stay ends at 00:00 UTC on 15 May, excluding that endpoint. Running the existing planner calculation on the committed hourly records gives:

| Result for the same 14-day stay | Lit ridge near Shackleton | Best-lit point on Connecting Ridge |
| --- | --- | --- |
| Sun visible | 296 h (88.1%) | 230 h (68.5%) |
| Earth visible | 300 h (89.3%) | 300 h (89.3%) |
| Longest darkness during the stay | 21 h | 81 h |
| Sun visible at arrival | Yes | No |
| Meets these visibility requirements | Yes | No |

Both points provide the same Earth-visibility hours for this stay. The Connecting Ridge point fails the sunlight and darkness thresholds and has no sunlight at arrival. The Shackleton ridge meets all the stated conditions. This is a result for those requirements and dates, not a declaration that one location is best for every mission.

The coordinates are latitude -89.43865, longitude -137.49989 for the Shackleton ridge, and latitude -89.4739, longitude -137.3158 for Connecting Ridge, in degrees with east-positive longitude. These are team-computed points. The example was checked using the implemented planner's calculation and stored hourly data.

### Two points about 2 km apart

The team-computed Shackleton ridge and shadowed points are about 2.1 km apart. The shadowed point is at latitude -89.36899, longitude -136.5882, in east-positive degrees. For May 2027, both use the same 2 m observer height, terrain method and UTC window: 1 May 00:00 through 31 May 23:00, or 744 hourly samples.

| Modelled May 2027 result | Lit ridge near Shackleton | Shadowed point near Shackleton |
| --- | --- | --- |
| Sun visible | 512 h (68.8%) | 0 h |
| Earth visible | 457 h (61.4%) | 0 h |
| Sun and Earth visible together | 436 h (58.6%) | 0 h |
| Longest dark interval within the month | 162 h (6.75 days) | All 744 h |

Across 2027, the ridge has sunlight at 7,936 of 8,760 hourly samples, or 90.6%. That high annual percentage still includes the 162-hour dark interval in May. The example shows why location, total availability and uninterrupted availability are different questions, and why a particular mission window needs inspection.

These are model outputs, not observations of an operating mission. The points were selected by the team's terrain scan, not designated as precise landing sites by NASA.

### NASA inputs, team processing, visible results

[NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) supplies hourly Sun and Earth directions. LRO LOLA south pole digital elevation models, accessed through [NASA Moon Trek](https://trek.nasa.gov/moon/), supply the surrounding terrain.

The team calculates a skyline in 360 directions, accounting for lunar curvature. It uses 5 m or 30 m terrain products near the site and a coarser representation farther away, out to 150 km. The standard observer is 2 m above local ground. A body counts as visible at a sampled hour when any part of its apparent disc clears the terrain horizon; no atmospheric refraction is applied.

Those calculations become hourly records and daily summaries. The website turns them into the table, panorama, charts and mission-window search. NASA data drives both the comparison and its explanation; site selection, processing and the connected workflow are the team's contribution.

The prepared dataset contains 18 terrain-aware south pole points with hourly data for 2027-2040. Custom and past-landing points use a separate smooth-Moon calculation. LOLA also supplies the map relief, whose illustrative lighting is not a real-time sunlight map.

Distances to large permanent shadows use NASA PGDA's LOLA polygon product, with Barker et al. (2023) credited for the data. A shadowed point in a one-year simulation is not automatically classified as permanently shadowed. For example, the separate Haworth region-centre point lies in a mapped large permanent shadow; its result does not describe every possible location in the wider region.

### Evidence and scientific limits

The repository includes checks for coverage, visibility values and agreement between hourly and daily totals. The May totals above were recounted from the committed hourly records. The 14-day example additionally uses the same calculation as the implemented planner, without starting the website.

Separate stored pipeline benchmarks are compared with Glaser and colleagues' [published Connecting Ridge study](https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf). At two published 10 m locations, the project's 2027 sunlit fractions differ from the reported multi-year results by about 0.3-0.4 percentage points. At the two 2 m benchmark locations, differences are larger: about 5.6 and 8.1 points. A further team check taking the maximum within a 20 m neighbourhood still leaves gaps of approximately 5.1 and 5.3 points at 2 m. It therefore does not resolve the discrepancy. Terrain products and time coverage differ; the cause has not been established. These comparisons do not establish a general accuracy percentage or a complete replication.

Sun visibility is not an electrical-power or thermal calculation. Earth visibility is not a radio-link budget or confirmation that a particular ground station can communicate. Hourly sampling and finite terrain resolution limit precision; terrain errors are not propagated. The slope indicator describes terrain at a 30 m scale, not roughness beneath a lander. The shadow-distance product excludes smaller shadows and does not confirm water ice or usable resources. Annual stored summaries truncate darkness at year boundaries; the interface's selected-site verdict and the planner use joined hourly data to retain a spell across New Year. Gaps at the outer coverage boundaries remain truncated.

The tool supports exploratory comparison and visibility-based planning. It does not assess every terrain hazard, spacecraft constraint or trajectory needed to approve a landing.

### Making the evidence usable

The shared interface offers plain-language captions, an About panel and a guided tour, alongside charts and the adjustable planner for deeper investigation. Share links preserve a selected prepared site and time; CSV export makes its hourly data available for inspection.

The demonstrated value is a traceable decision: the same stay requirements can be tested against multiple locations and the result explained through the underlying conditions. For education, the ridge/shadow example and guided tour connect lunar geography with power and communication constraints. For preliminary planning, the table and requirements search identify options for closer engineering investigation. Educational outcomes, task-time improvements and professional adoption have not been measured.

The website uses Next.js, React and TypeScript with Tailwind and UI components; Python prepares the scientific data. Prepared data now cover 2027-2040. Further validation at the standard 2 m height and observation of first-time users would strengthen the next iteration. A further AI feature remains under consideration.

## END OF DRAFT TEXT

---

## TEAM NOTES AND QUESTIONS - DO NOT SUBMIT

**Everything below this heading is preparation material, not part of the description.**

### Resolved answers and newer evidence

| Topic | Answer used |
| --- | --- |
| Coordinates/map | No snapping. Empty-map clicks fill coordinates to two decimals, then Add site creates a custom point; an existing pin selects its prepared site. Up to three custom points. F03-F05. |
| Custom-point model | Smooth Moon, no local terrain; explicitly labelled, separated and not ranked against terrain-aware points. F03-F05. |
| Comparison | The shared table, not a separate pick-two feature. Monthly Power = Sun hours; Comms = Earth hours; Both = simultaneous hours. F05/F06. |
| Coverage | Nick and the data handoff confirm 2027-2040. PR #82 supplies the data; PR #87 updates the app's year list and joined timeline. The implementation question is resolved; final screenshots and public access are still pending evidence. F07-F09. |
| Audience interface | Shared at present, with tour/help and more detailed planner controls. Later audience-mode decisions are not confirmed. F05/F06. |
| Planner/AI | Implemented numerical requirements search; AI remains under consideration. A qualifying day contains at least one qualifying hour, not necessarily a whole day of valid arrival hours. F05/F06. |
| Slip margin | Remaining consecutive eligible days after the selected day. It does not promise every hour is valid or model launch-vehicle timing/trajectories. F05. |
| Visible outputs | Newer verdict text includes longest darkness; Both sorting is implemented. The example's simultaneous-hours value was checked in data, not claimed as a particular printed column. F05 supersedes the older interface snapshot. |
| Map imagery | A LOLA-derived hillshade now underlies the map. Its artificial lighting is illustrative, not actual solar illumination. A05/F05. |
| Literature | The EPSC conference paper and journal abstract were read. DLR 94242 is the conference paper; 94240 is the Icarus record. The full journal paper was not read. T04/T05. |
| New terrain context | Selected-site card includes 30 m-scale slope, distance to mapped PSRs larger than 1 square kilometre, and a distinct 2027-2030 10 m Sun summary. These do not silently inherit the 2040 hourly range. T06/F08. |
| New validation | The 20 m neighbourhood sensitivity check still leaves about five percentage points at both 2 m benchmarks. Pixel rounding alone is not an established explanation. F08. |

The website was not run in this writing task. The existing planner calculation was executed directly against stored hourly records; that check is not a browser or usability test.

### Reproduction and source notes

- Current snapshot: [10aa615 / F09](../sources.md#f09), updating [dbec867 / F08](../sources.md#f08) and [3a065ee / F05](../sources.md#f05). Relevant evidence: PRODUCT.md, lib/sort.ts, lib/windows.ts, lib/time.ts, current data records and their interface components. No application or data-processing code was edited.
- Executed the existing `landingHours` calculation with the Short lander preset (336 hours, Sun share 0.8, Earth share 0.5, maximum darkness 24 hours) and recounted each 1-15 May 2027 stay. Results are in the draft's 14-day table. This verifies a numerical path, not the final rendered interface or an operational mission requirement.
- Recounted May 2027 indexes 2880-3623: ridge Sun/Earth/both 512/457/436 and longest within-month dark run 162; shadow 0/0/0 and 744.
- Checked 18 catalogue entries and 18 series files per year. Inspected Shackleton metadata: 8,760/8,784/8,760/8,760 samples in 2027/2028/2029/2030, step 60 minutes.
- Recounted four stored benchmark strings, 8,760 entries each. At 2 m, spots 1/2 give 83.92%/86.66%; at 10 m, spots 3/4 give 95.95%/95.97%. [T04](../sources.md#t04) reports 92%/92.3% and 95.6%/95.66%. Do not use the closer 10 m results as an accuracy guarantee for the 2 m interface.
- T04's abstract discusses 19 years while figure captions say 20 years; the draft uses multi-year. Sunlit-time fraction differs from partial-disc-weighted average illumination.
- The current data handoff supplies corrected Icarus/EPSC/Mazarico credits, Barker/PGDA credits and coverage through 2040. Sources and data questions addressed by that handoff are resolved; they are not requested again below.
- These checks verify committed outputs, the existing numerical calculation and source comparisons, not a fresh Horizons query, terrain rebuild or independent QuickMap validation.

### Review against NASA's rubric

| Criterion | Evidence and writing choice | Remaining limit |
| --- | --- | --- |
| Impact | Demonstrates a 14-day decision and separates educational and preliminary-planning uses | Intended benefit is not measured adoption, saved cost or educational improvement |
| Creativity | Explicitly connects sorting, physical explanation and a transparent whole-stay search | No unsupported first-ever claim or invented superiority to existing tools |
| Validity | Explicit method, sampling, search criteria and close/discrepant benchmarks | Standard-height uncertainty, final live check and further independent validation |
| Relevance | Horizons/LOLA drive the outputs and planner | Imagery/branding cannot substitute for analytical data use |
| Presentation | One question leads through working journey, evidence, method, confidence and value | Final screenshots and a consistent deck still need preparation |

Authority: [N01](../sources.md#n01), pp. 5-7; [N02](../sources.md#n02), pp. 6-9. Writing follows the [submission-page guide](../submission-page-guide.md) and [research strategies](../winning-strategies.md), including their credited professional advice. This is an evidence review, not a guaranteed or predicted score.

### Questions - answer below each question only

Please add `Answer - name, date:` below the relevant question. Leave the draft text and question unchanged; Nick will incorporate agreed answers. No source reconstruction or new data build is requested from Gio: the latest data/credit handoff is incorporated.

1. **D1 - Trim (nitrimandylis):** Can you provide screenshots from the final public build showing (a) the table sorted by Power, Comms and Both for one labelled month, (b) a linked site/time horizon view, and (c) the Short lander example above with its requirements and result? Please provide the public URL, revision, UTC selections and screenshot paths/links, and state whether the displayed results match the draft's tables.

   Answer - Trim, 2026-11-15: Public URL: https://www.moonfrom.earth/ (the bare domain redirects to it). Checked on 15 November 2026 with `main` at 799f550. The app code last changed in 10aa615 (PR #87), and the live site shows that commit's 2027 to 2040 year picker. I did not read the deployment id. Claude Code captured the screenshots in my session, in a headless Chromium with no cookies or login. They are 3200 x 2000 px PNG files in `docs/evidence/`.

   (a) May 2027 sorted three ways, opened with `?site=shackleton-ridge&time=2027-05-01T00:00Z`: `may-2027-sort-power.png`, `may-2027-sort-comms.png`, `may-2027-sort-both.png`. Top three rows. Power: Lit ridge near Shackleton (512 Sun h), Candidate near Haworth (488), Best-lit point on Connecting Ridge (465). Comms: Candidate near Haworth, Candidate near Malapert, Candidate near Nobile (744 Earth h each). Both: Candidate near Haworth, Lit ridge near Shackleton, Candidate near Nobile.

   (b) Linked site and time: `?site=shackleton-shadow&time=2027-05-16T07:00Z` opens Shadowed ground near Shackleton at 16 May 2027, 07:00 UTC, with its sky panorama: `shared-link-shackleton-shadow-2027-05-16T07.png`.

   (c) Short lander: `planner-short-lander-2027-05-01.png`, with 1 May 2027, 00:00 UTC selected on the main page. The preset shows 14 days, Sun 80%, Earth 50%, longest dark spell 24 hours. The result line reads: "10 of 18 sites can host this mission from 2027 to 2040. Best: Lit ridge near Shackleton, with a landing time that works on 2527 of 5114 days."

   2040, for D2: `?site=shackleton-ridge&time=2040-05-16T07:00Z`, `year-2040-shackleton-ridge-2040-05-16T07.png`. The verdict reads Sun up 100% of May, Earth 52%.

   Match with the draft's tables: yes for everything the interface displays. The May 2027 row for the Shackleton ridge shows 512 Sun h and 457 Earth h, and its verdict gives a longest dark spell of 6 d 18 h, which is 162 h. The shadowed point shows 0 and 0 at -89.3690, -136.5882. In the planner the Shackleton ridge has its next landing at 1 May 2027, 00:00 UTC, so the draft's stay meets the preset. Connecting Ridge shows its next window on 12 July 2027, so that stay does not. Not displayed anywhere: the 436 simultaneous hours, and the per-stay figures in the 14-day table (296 h, 230 h, 300 h, 21 h, 81 h). Those remain data checks, not screenshots.

2. **D2 - resolved, 15 November 2026:** PR #87 (10aa615) updates lib/time.ts to 2027-2040 and retains a separately labelled 2027-2030 height comparison. The implementation/range question is answered by repository evidence F09. No repeat answer is needed; include a 2040 screenshot in D1's final-build evidence.

3. **D3 - Nick, optional usability evidence:** Can two or three people outside the team try a defined task without coaching? Ask one to explain the ridge/shadow result and another to find an arrival option using stated stay requirements. Record participant count, task, completion or failure, confusing labels and useful observations. This is our suggested small check, not a NASA-required study or tester count. If it is not done, retain the current unmeasured-outcome wording; it does not block submission.

   Answer - Nick, date: Pending.

Final names are assigned to Nick in [high-level-summary.md](high-level-summary.md); credits, disclosure and links have named owners in [submission-fields.md](submission-fields.md). These questions request evidence and confirmations, not new features. The slide-deck file remains empty until Nick resumes deck preparation.

User-feedback basis: N01 p. 6 assesses usability; N02 does not require a user-testing study. W04 is a verified winner's first-hand account of interviews and prototype testing, with timing limits. Our two-or-three-person suggestion is an application, not evidence that a particular testing method wins awards.
