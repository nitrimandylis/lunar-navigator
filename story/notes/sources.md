# Sources and evidence register

Research basis: 14 November 2026. Implementation/source revisions: 15 November 2026. Maintainer: Nick / koum.
This is the shared register for presentation research and project credits. It is not proof that a resource is implemented in the app. Source IDs are used throughout the guides.

## Navigation and precedence

- [NASA requirements and rubric](nasa-rules-and-rubric.md)
- [Submission page guide](submission-page-guide.md)

| Rank | Authority | Permitted use |
| --- | --- | --- |
| 1 | Current written NASA rules, terms, rubric and official challenge | Governing instructions and evaluation. Distinguish requirements from recommendations. |
| 2 | Current GO Team clarification; current briefing transcript | Explain current instructions. Written guidance/terms win if inconsistent; identify Navigator answers separately. |
| 3 | Historical official NASA guidance | Supporting presentation principles only; never override current rules. |

Official NASA scientific documentation is rank 1 for describing its own data/system, not for competition requirements. Current written sources supersede old versions.

## How to maintain an entry

Record ID, title/publisher/date, original URL, exact section/page/timestamp, inspection method, what it supports, limits and actual project usage. Date unknown means not independently established; do not invent it. The original research set was reviewed on 14 November 2026; later entries state their own review dates.

## Current NASA and event sources

### N01

**Judging & Awards Guide.** NASA Space Apps, 13 November 2026. **Rank 1.**

- Original: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Uploaded copy: NASA Space Apps Challenge.pdf, 11 pages, supplied by Nick.
- Locations: p. 3 eligibility; pp. 5-7 rubric; p. 7 presentation emphasis; pp. 8-11 progression/awards.
- Inspection: accessible text throughout the uploaded PDF. Blank/image-only navigation areas were not interpreted as extra text. Live page retrieval repeatedly failed.
- Supports current five-criterion 1-5 evaluation, eligibility and progression. No published percentage weighting identified.

### N02

**Project Submission Guide.** NASA Space Apps, 13 November 2026. **Rank 1.**

- Original: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Uploaded copy: NASA Space Apps Challenge PROJECT SUBM.pdf, 15 pages.
- Locations: p. 2 timing; pp. 3-5 editing/hosting/classification; pp. 6-9 fields/data/SI; pp. 10-11 demo guidance; p. 12 submission/minor-media restrictions; p. 14 certificates.
- Inspection: all accessible PDF text read; screenshots/blank printed pages not visually audited. Live page was inaccessible.
- Main source for the submission process. Separates most evaluation based on the full submission (p. 6) from the demo's presentation contribution.

### N03

**2026 project-submission and judging briefing, supplied transcript. Rank 2.**

- Video supplied by Nick: https://www.youtube.com/watch?v=CV7AYfMRyMM
- Transcript supplied as pasted text.
- Locations: 1:07-2:02 editing/submitting; 2:23 summary length suggestion; 2:43-4:18 links; 4:25-6:41 fields/SI/data; 6:45-8:54 eligibility/submission; 10:44-12:15 judging/dates.
- Full supplied transcript read; playable video, visuals and uploader/channel were not independently inspected. Automatic transcription has spacing/recognition errors.
- Supplementary source, subordinate to N01-N02. The video's general team-size minimum is less precise than N01's Local/Universal distinction.

### N04

**Storytelling challenge rule questions, Discussion #1947.** Answer by chancyshah, 12 November 2026, labelled Navigator answered. **Official-channel clarification, below GO Team/current written sources.**

- https://github.com/nasa/spaceapps/discussions/1947
- Location: full answer, numbered items 2-7.
- Supports inclusion of title/closing slides in the cap, supplementary material distinction and SI/attribution clarification. Do not attribute the community replies or Navigator answer to NASA executive judges.

### N05

**Asking about the resources, Discussion #1827.** Paula-GO-Team, 5 November 2026. **Rank 2, GO Team.**

- https://github.com/nasa/spaceapps/discussions/1827
- Location: complete accepted answer; GO Team Answered label.
- Supports qualifying NASA data from challenge Resources, citation obligations, optional additional sources and the distinction between pre-event research and project-building. Do not infer our team's compliance without evidence.

### N06

**Lunar Landing Site Navigator, 2026 challenge.** NASA Space Apps. **Rank 1.**

- https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/
- Location: official indexed challenge summary, audiences and objective.
- Summary retrieved through search; live detail page repeatedly returned errors. Supports core site/date and Sun/Earth horizon comparison goal. Full details read through L01, explicitly lower authority.

### N07

**Participant Terms & Conditions.** NASA Space Apps, current legal page; exact revision date not established. **Rank 1.**

- https://www.spaceappschallenge.org/legal/
- Locations: Submissions; Intellectual Property Rights in Solutions; Use of Third-Party Materials.
- Relevant sections retrieved in indexed results; live page failed. Supports attribution/rights and under-18 identifiable-name/voice/likeness concerns. Full legal page not audited. Written member-credit handling remains unresolved against N02 p. 11; ask organizers before publishing.

### N08

**Submission format/branding, Discussion #1858.** Chris-GO-Team, 9 November 2026. **Rank 2.**

- https://github.com/nasa/spaceapps/discussions/1858
- Location: numbered accepted answer, especially items 3-5.
- Supports required submission components and source fields. Links to branding guidance; not a full inspection of that separate branding guide.
- Additional hosting clarification: https://github.com/nasa/spaceapps/discussions/1991 (13 November 2026; Navigator answer). GitHub is not the sole permitted host; N02 independently governs public hosting.

## NASA science references: system background and analytical inputs

### T01

**Horizons System manual.** NASA/JPL Solar System Dynamics, displayed version 4.98e, 25 August 2026. **Official technical documentation.**

- https://ssd.jpl.nasa.gov/horizons/manual.html
- Locations: Purpose and Scope; Coordinate Center Selection; non-Earth sites/refraction; Definition of Observer Table Quantities, item 4 (AZ-EL); rise/set and limitations sections.
- Supports descriptions of ephemerides and checking observing-site/output conventions. No refraction is modeled for non-Earth sites. Its default horizon must not be described as our calculated terrain skyline.
- Previously listed for lunar Sun/Earth positions. F01/F04/F05 now document the reported implementation and checked outputs; exact final build provenance remains to be confirmed.

### T02

**Lunar Orbiter Laser Altimeter (LOLA).** NASA Science; publication date not established. **Official instrument background.**

- https://science.nasa.gov/mission/lro/lola/
- Locations: instrument overview, Instrument Operations and educational resources.
- Supports explaining lunar surface measurements/topography. Does not identify our terrain product, resolution, observer height or implemented horizon method.
- Instrument background credit preserved. The exact terrain products and their reported use are documented in F01/F04/F05; this instrument page is not their download reference.

### T03

**Other named challenge resources: inventory, not implementation evidence.**

- LROC QuickMap: https://quickmap.lroc.asu.edu/
- Moon Trek: https://trek.nasa.gov/moon/
- CSA Moon exploration is named as partner background in the challenge resource discussion; record the exact page if used.
- These are candidate references recorded in team instructions and L01. Their interfaces and our team's use were not audited here; do not call them live project feeds.

### L01

**Lunar Landing Site Navigator reproduction.** HackAthlone 2026 organizer. **Secondary copy of challenge text, below NASA original.**

- https://hackathlone.com/challenges/lunar-landing-site-navigator
- Locations: Summary, Background, Objectives, Potential Considerations and Resources.
- Detailed text inspected. Useful for suggested date/site comparison, horizons, temporal views and audience accessibility. Full wording should be checked against NASA if the original becomes available. Suggestions are not all mandatory features.

## Historical official guides

### H01

**Space Apps 2021 Project Demo Guide.** NASA Space Apps GO Team, updated 13 September 2021. **Rank 3.**

- https://sa-2019.s3.amazonaws.com/media/documents/Space_Apps_2021_Project_Demo_Guide.pdf
- Locations: PDF pp. 3, 5-7 (story, readable visuals, user experience, data, preparation).
- Historical corroboration for clear visual storytelling and planning. Not current evidence for dates, membership, disclosure rules or scoring procedure.

### H02

**Space Apps 2022 Project Submission Guide.** NASA Space Apps GO Team, 13 September 2022. **Rank 3.**

- https://spaceapps-prod.s3.amazonaws.com/media/documents/Space_Apps_2022_Project_Submission_Guide.pdf
- Locations: pp. 3, 5-7 and demo/pitch sections.
- Supports historical distinction between full project, detailed text and demo. Current N02 supersedes its form/rules. Do not import its older partner-data eligibility wording into 2026.

### H03

**2025 Judging Instructional Guidance.** NASA Space Apps. **Rank 3.**

- https://spaceapps-v2-staging.s3.amazonaws.com/media/documents/Final_Space_Apps_2025_Judging_Guidelines_for_web.pdf
- Locations: p. 1 screening/holistic assessment; pp. 2-3 criteria; p. 4 award descriptions.
- Previously used while current guides were inaccessible. Now superseded for current scoring language by N01. The older holistic instruction does not negate 2026's per-criterion wording.

## Project credits to complete before hand-in

This section records **actual usage**, unlike the research register above.

| Material | Status | Required completion |
| --- | --- | --- |
| Horizons Sun/Earth positions | Implementation reported in F01/F04 and reviewed in F05 | Confirm final build provenance and source conventions |
| LOLA terrain | Named products/methods reported in F01/F04; checked-output review in F05 | Exact product download references, rights and final release confirmation |
| Moon imagery/textures/site coordinates | Past landing coordinates and the map relief picture recorded below (A04, A05); other site coordinates are in the data handoff | Permissions re-read before hand-in |
| Other libraries/tools/icons/fonts/media | Fonts and crater outlines recorded below (A01 to A03); the rest pending whole-team inventory | Exact source and applicable attribution/licensing |
| Screenshots/results | Pending final evidence | App revision, scenario, date, verifier and original capture |
| AI/SI assistance | Codex used for research/synthesis, Markdown drafts and earlier setup | Whole team adds all actual tools/uses, media indicators and metadata as required |

Do not promote a researched source into an implemented-data claim. Cite borrowed ideas/text/assets actually used; the final NASA references should accurately reflect project usage and any preparation material incorporated.

### Confirmed in the app (interface)

Recorded by trim from the code on `main`: A01 to A03 on 14 November 2026, A04 and A05 on 15 November 2026. All five are in actual use.

#### A01

**Excon typeface.** Indian Type Foundry, distributed by Fontshare.

- https://www.fontshare.com/fonts/excon
- Loaded in `app/layout.tsx` from the Fontshare CSS link `https://api.fontshare.com/v2/css?f[]=excon@400,500,700&display=swap`. No font files are in the repository.
- Used for all interface text.
- Licence: ITF Free Font License, as listed on Fontshare. Re-read the licence page before hand-in.

#### A02

**JetBrains Mono typeface.** JetBrains, distributed by Google Fonts.

- https://fonts.google.com/specimen/JetBrains+Mono
- Loaded in `app/layout.tsx` from the Google Fonts CSS link `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap`. No font files are in the repository.
- Used for every number in the interface.
- Licence: SIL Open Font License 1.1.

#### A03

**Gazetteer of Planetary Nomenclature.** IAU Working Group for Planetary System Nomenclature, hosted by USGS Astrogeology.

- https://planetarynames.wr.usgs.gov
- Location: Moon feature search results, read 14 November 2026.
- Used for the names, centre coordinates and diameters of the craters outlined on the south pole locator map (`components/south-pole-map.tsx`).
- Not used for landing site coordinates or for any Sun or Earth calculation.

#### A04

**Table of Anthropogenic Impacts and Spacecraft on the Moon.** NASA Space Science Data Coordinated Archive (NSSDCA), Goddard Space Flight Center.

- https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html
- Read 14 November 2026.
- Used for the landing coordinates of the five past landings listed for comparison (`lib/reference-sites.ts`): Apollo 11, Blue Ghost Mission 1, SLIM, Chandrayaan-3 and Chang'e 6.
- Coordinates only. The Sun and Earth angles for these sites are computed in the app on a smooth Moon with no terrain.

#### A05

**LRO LOLA DEM v4, South Pole (30 m and 5 m).** NASA Lunar Reconnaissance Orbiter, Lunar Orbiter Laser Altimeter, downloaded through NASA Moon Trek.

- https://trek.nasa.gov/moon/
- Files `LRO_LOLA_DEM_SPole75_30mp_v04.tif` (30 m) and `LRO_LOLA_DEM_SPole875_5mp_v04.tif` (5 m). The raw files are not in the repository.
- Used for the shaded relief picture under the south pole map: `public/data/basemap.png` (out to latitude -82) and `public/data/basemap-87.5.png` (out to -87.5), made by gio's `data/basemap.py` and drawn in `components/south-pole-map.tsx`.
- The shading uses a made-up light (azimuth 315 degrees, 20 degrees up, heights doubled) so that crater walls are readable. It is not a sunlight map and says nothing about real illumination.
- Credit line from gio: `data/FACTS-FOR-STORY.md`, section 9. Licence of the Moon Trek product not re-checked: re-read before hand-in.

## Earlier setup references retained for provenance

The previous source list cited [Codex Cloud](https://developers.openai.com/codex/cloud/) for workflow and [Bun 1.4.2](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.2) for historical machine setup. Neither is a scientific data source or NASA submission requirement. The current repository instructions specify npm; do not follow old Bun helper instructions as current setup guidance. No runtime/setup changes are part of this task.

## Open questions

- Organizer-approved written under-18 credits.
- Team-confirmed datasets, functionality, validation and evidence.
- Final public URLs and access, actual asset licences and team SI account.
- Any later official guidance revision; record changes instead of silently overwriting the dated basis.

## Project data handoff

### F01

**Facts for the story (slides, submission page).** Gio's agent, 14 November 2026. **Internal implementation evidence, not NASA rules or independent scientific validation.**

- [Committed snapshot](https://github.com/nitrimandylis/lunar-navigator/blob/c99fb3df081aca91e54ac95b57e66b12fdeac194/data/FACTS-FOR-STORY.md); [current file](https://github.com/nitrimandylis/lunar-navigator/blob/main/data/FACTS-FOR-STORY.md). Added through PR #41. Snapshot reviewed through GitHub's rendered document on 14 November 2026.
- Locations: sections 1-3 positions/terrain/visibility method; section 4 internal consistency checks; sections 5-6 site provenance and Shackleton comparison; section 7 plausibility checks; section 8 limitations; section 9 credits; final section unverified items.
- Supports the prepared 18-point, hourly 2027 dataset; reported Horizons and LOLA usage; the May/full-year comparison; definitions and limitations. The writing task did not rerun the build, query Horizons, inspect raw terrain files or validate the finished interface.
- This later owner handoff supplies implementation evidence where the older T01-T03 and project-credit rows record usage as pending. It does not turn those earlier background references into independent verification or prove final interface behaviour.
- Reported analytical sources: NASA/JPL Horizons (https://ssd.jpl.nasa.gov/horizons/ ; API https://ssd.jpl.nasa.gov/api/horizons.api) and LRO LOLA DEM v4 via NASA Moon Trek (https://trek.nasa.gov/moon/). Products: `LRO_LOLA_DEM_SPole875_5mp_v04.tif` and `LRO_LOLA_DEM_SPole75_30mp_v04.tif`. Exact product-access references and usage rights still need final confirmation.
- Reported coordinate sources: LROC/Mark Robinson, 26 February 2025, IM-2 intended landing point (https://lroc.im-ldi.com/images/1401); Lunar Resources Registry south pole map (https://lunarresourcesregistry.com/south-pole-map/) for region centres/search starting area. These original pages were not independently rechecked in this drafting task. A region centre is not an official precise landing point or a model of an entire region.
- Historical literature note: F01 linked https://elib.dlr.de/94242 as the Icarus paper. That is the EPSC conference paper; T04/T05 give the corrected source distinction and later inspection status. F05 records the newer coordinate-specific benchmarks. No general accuracy percentage or complete replication is established.
- Do not use the unrecorded "within about 70 m" terrain rerun as verified evidence. Retain the handoff's other gaps: UT/UTC treatment, source-based terrain-product assignment, original coordinate checks, rights and Gazetteer access-path reconciliation.
- Preparation drafts based on this source are in `story/drafts/`. NASA N01-N02 remain the authority for judging and submission; F01 is the basis for this project's reported calculations and their limits.

### F02

**Project scope and feature-status clarification.** Nick / koum, 14 November 2026. **Internal team report and intended scope, not an independent interface test.**

- Nick reports site selection and date changes as working, and describes exact-coordinate entry and clicking the lunar map to choose a location as available. The 3D Moon is removed from scope.
- Side-by-side comparison is planned, not yet confirmed working. Simpler public/educator and more detailed professional interfaces are planned.
- An AI feature to help identify locations and times is planned. In follow-up, Nick confirmed that the selection criteria are still being decided. Search coverage, model/provider, numerical method and verification are not established; do not claim a global best site or a validated optimiser.
- This report does not confirm whether coordinate/map selection analyses the exact point or selects a prepared point, or whether the custom-point terrain treatment has changed since F01. Those are explicit questions for trim/gio.
- The drafting task did not run the website or test these functions. Use this source to distinguish reported working features from intended work, then update the final submission against the completed project.

## Scientific reference clarification - 15 November 2026

### T04

**Glaser et al. (2014), Connecting Ridge - A landing site at the lunar south pole with extended illumination.** EPSC Abstracts 9, EPSC2014-136-1. **Primary conference paper; authoritative for its own reported simulation.**

- Record: https://elib.dlr.de/94242 ; open paper: https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf
- Accessible text of both pages read on 15 November 2026, including method, point table and results. Supports published coordinates/heights, disc treatment and sunlit-time benchmark values.
- This is not the Icarus article. Duration wording differs between abstract and figure captions; the draft says multi-year. A published simulation is not observational ground truth or independent validation of this project.

### T05

**Glaser et al. (2014), Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA.** Icarus 243, DOI 10.1016/j.icarus.2014.08.013. **Peer-reviewed journal record/abstract; full journal text not inspected.**

- DLR record/abstract: https://elib.dlr.de/94240/ ; DOI: https://doi.org/10.1016/j.icarus.2014.08.013
- Abstract/bibliographic record read on 15 November 2026. Corrects the historical F01 link that identified 94242 as the journal paper. Do not describe the conference paper and journal abstract as a fully read journal article.

## Later project evidence - 15 November 2026

### F03

**Trim's answers for the story questions.** Team-authored handoff, PR #49. **Internal evidence, not a live-site test.**

- [Snapshot](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/docs/trim-answers-for-story.md); now at `story/notes/answers-trim.md`.
- Answers read, including coordinates, custom-point separation, displayed metrics, original controls, assets and AI assistance. They describe code at 8d9c2e2.
- Later F05 evidence supersedes the no-imagery, 2027-only and planner-unbuilt statements. Preserve the replies' original dates and verification limits.

### F04

**Gio's answers for the story questions.** Team-authored data handoff, PR #46. **Internal evidence, not an independent rebuild or live-site test.**

- [Snapshot](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/data/ANSWERS-FOR-STORY.md); now at `story/notes/answers-gio.md`.
- Answers read, including data/interface distinctions, the May example, coordinate provenance, tool/AI use and source limits. Most describe 035f289 and 2027.
- Rights, final links, some human-review details and the original literature check were left unconfirmed. T04-T05/F05 resolve parts of the literature question and update coverage; do not treat every old Not yet confirmed as resolved.

### F05

**Repository and committed-output review.** Snapshot 3a065eedbcc39549afe5157bb2572e5eae66c303, reviewed 15 November 2026. **Primary implementation/stored-result evidence, not a manual usability test or fresh scientific rebuild.**

- [PRODUCT.md](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/PRODUCT.md): table comparison, linked views, time controls, planner, help, sharing/export and layout.
- [lib/sort.ts](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/lib/sort.ts): monthly Power = Sun hours, Comms = Earth hours, Both = simultaneous hours; not a universal suitability score.
- [lib/windows.ts](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/lib/windows.ts) and components/mission-planner.tsx: explicit stay requirements, Sun at arrival, full-window coverage, qualifying-day counts, next time and day-level slip margin. Presets are starting assumptions, not agency-certified requirements. This is numerical search, not an AI model.
- [lib/time.ts](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/lib/time.ts) and public/data/: 2027-2030. Checked 18 catalogue entries and 18 series-file names per year. Inspected Shackleton metadata: 8,760/8,784/8,760/8,760 hourly samples, step 60 minutes.
- Recounted May 2027 indexes 2880-3623 from the committed series: ridge Sun/Earth/both 512/457/436 and longest within-month dark run 162; shadow 0/0/0 and 744. This is output verification, not a Horizons/terrain recomputation.
- [data/KNOWN-ANSWERS.md](https://github.com/nitrimandylis/lunar-navigator/blob/3a065eedbcc39549afe5157bb2572e5eae66c303/data/KNOWN-ANSWERS.md), data/known_answers_glaser_spots.json and data/tests/test_known_answer.py: benchmark record. Recounted four stored binary strings and compared with T04. Closer 10 m results do not establish standard 2 m accuracy; larger 2 m discrepancies and differing terrain/time coverage remain.
- Components/about-overlay.tsx holds the newer benchmark explanation; A05 and components/south-pole-map.tsx document the illustrative LOLA hillshade.
- App/layout.tsx supplies the current title; package.json supplies the current dependency inventory. Relevant implementation was read without editing/running the app. No new automated application tests or full terrain build were run.
- This snapshot established the earlier revision baseline. F07/F08 now update coverage, terrain indicators, validation and the worked decision; preserve this record's original verification scope.

### F06

**Nick's earlier scope clarification.** 15 November 2026. **Internal team decision/status report, with coverage superseded by F07/F08.**

- Coverage through 2040 is planned and not yet present; current reviewed coverage is 2027-2030.
- AI remains under consideration. The interface is currently shared; a later audience-mode decision is not confirmed.
- Comparison is the table: all sites can be viewed and sorted by Comms, Power or Both. Do not present it as a separate comparison feature.
- Supersedes the relevant planned-feature descriptions in F02. Check later release changes before updating the final submission.

### F07

**Nick's coverage confirmation and relayed data-credit handoff.** 15 November 2026. **Primary team status/provenance report; not an independent scientific validation.**

- Nick confirmed that data through 2040 now work. The follow-up handoff states 2027-2040 and identifies the corrected citation blocks in data/KNOWN-ANSWERS.md, the psr_km section of data/README.md, and the DEM/hillshade credits in data/FACTS-FOR-STORY.md.
- Use KNOWN-ANSWERS for the corrected Glaser bibliography: DLR 94242 is EPSC; 94240 is the Icarus record. The older FACTS link must not be repeated as the journal link.
- The handoff explicitly preserves the close 10 m results and larger 2 m differences. It also reports zero annual Sun at the Haworth region-centre point and no lit point in the team's 15 km box scan. A point/scan result does not establish that every location in NASA's broader candidate region is unusable.
- This resolves the old planned-2040 status and missing data-credit request. It does not claim that this agent tested the final public interface, audited licences or completed a new terrain build.

### F08

**Updated repository review and executed planner example.** Snapshot dbec86782cb7226b11167e0d635419b4707b8abf, 15 November 2026. **Primary implementation/stored-result evidence; not a browser usability test.**

- [Data coverage](https://github.com/nitrimandylis/lunar-navigator/commit/dbec86782cb7226b11167e0d635419b4707b8abf), PR #82: checked 18 site-series and 18 summary filenames per year for 2027-2040. Inspected Shackleton series metadata for all 14 years: start at 1 January UTC, 60-minute step, 8,760/8,784 samples as appropriate; 122,736 hours in total. Other arrays were not exhaustively revalidated here.
- [Planner](https://github.com/nitrimandylis/lunar-navigator/blob/dbec86782cb7226b11167e0d635419b4707b8abf/lib/windows.ts): executed existing landingHours and longestDarkSpell with the existing Short lander assumptions (336 h, minimum Sun 0.8, Earth 0.5, maximum darkness 24 h). For 1 May 2027 00:00 UTC to 15 May 00:00 exclusive, ridge Sun/Earth 296/300 h, longest dark 21 h, sunlight at arrival: passes. Connecting Ridge 230/300 h, dark 81 h, no Sun at arrival: fails. The detailed draft includes exact coordinates. Executing a stored-data calculation does not validate its physical inputs independently.
- [Selected-site card](https://github.com/nitrimandylis/lunar-navigator/blob/dbec86782cb7226b11167e0d635419b4707b8abf/components/selected-site.tsx), data/README.md and public/data/sites.json: terrain-derived slope at 30 m scale, large-PSR distance, and Sun fraction at 10 m. The height summary specifically covers 2027-2030. Do not silently extend that summary's period to 2040 or treat coarse slope as lander-footprint safety.
- [Known answers](https://github.com/nitrimandylis/lunar-navigator/blob/dbec86782cb7226b11167e0d635419b4707b8abf/data/KNOWN-ANSWERS.md), PR #83: a new 20 m neighbourhood check still leaves 5.3/5.1 percentage-point gaps for spots 1/2 at 2 m. Read the record; its horizon rebuild was not rerun. The cause remains unresolved; close original-point 10 m results do not establish 2 m accuracy.
- New Year handling was updated in PR #78: selected-site daily verdicts and planner checks use joined hourly data, while the raw annual summaries remain cut at year boundaries.
- lib/time.ts in this snapshot still lists 2027-2030 despite the additional committed data. F07 supplies working-range confirmation; D2 in the detailed draft requests Trim's final release/interface evidence. No claim of a new signed-out website check is made.
- No server, application build, full test suite or terrain processing was started. Only story/ Markdown was edited. Current code, stored outputs and the user's handoff have distinct verification scopes.

### F09

**Full-range interface update, PR #87.** Snapshot 10aa615fc8b82d2285edad22841f76bfa2baea26, reviewed 15 November 2026. **Primary implementation evidence; final browser screenshots remain pending.**

- [Commit](https://github.com/nitrimandylis/lunar-navigator/commit/10aa615fc8b82d2285edad22841f76bfa2baea26) and lib/time.ts now list every year from 2027 through 2040. The shared timeline drives the picker, planner and export.
- components/selected-site.tsx explicitly compares 2 m and 10 m Sun shares over the same 2027-2030 subset. It does not relabel the older 10 m calculation as a 2027-2040 summary.
- Resolves the earlier range-implementation question D2 and supersedes F08's then-current 2030 interface limit. D1/S2 still request final screenshots, public URL and signed-out checks. No additional data-source answer is needed from Gio.
- Updated files outside story/ came from the team's merged changes. This writing task only edits story/ Markdown.

### T06

**NASA PGDA, A New View of the Lunar South Pole from LOLA (product 90). Official data source.**

- https://pgda.gsfc.nasa.gov/products/90 ; inspected 15 November 2026, PSR products and citation instructions.
- Confirms the LPSR_80S_20MPP_ADJ_1km2 product and requested Barker citation. Team use and distance computation are documented in F08/data/README.md.

### T07

**Mazarico et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography.** Icarus 211, 1066-1081. **Primary journal reference; NASA record/abstract inspected, not full paper.**

- DOI https://doi.org/10.1016/j.icarus.2010.10.030 ; NASA NTRS https://ntrs.nasa.gov/citations/20120010094 , inspected 15 November 2026.
- Method/background credit supplied by the data team. The NASA abstract supports horizon-based illumination and PSR background; it is not an independently completed validation of our selected points. No claim that the full article was read.

## Consolidated data credits for the submission

Prepared from the F07 handoff and F08 records. These credit the team's actual inputs and reference roles; they do not imply NASA endorsement or permission to copy another team's work. Keep the limits in T04-T07 and the final draft.

- **NASA/JPL Horizons:** https://ssd.jpl.nasa.gov/horizons/ ; API https://ssd.jpl.nasa.gov/api/horizons.api . Hourly Sun/Earth directions and custom-point ephemerides. Prepared visibility data now span 2027-2040; the earlier saved-response checks described in F01 are dated 14 November 2026.
- **Terrain and hillshade:** LRO LOLA DEM v4 South Pole, via NASA Moon Trek, https://trek.nasa.gov/moon/ . LRO_LOLA_DEM_SPole875_5mp_v04.tif (5 m) and LRO_LOLA_DEM_SPole75_30mp_v04.tif (30 m). Used for terrain horizons, elevations and team-rendered basemap.png/basemap-87.5.png. Hillshade lighting is illustrative.
- **Glaser, P., Scholten, F., De Rosa, D., Figuera, R. M., Oberst, J., Mazarico, E., Neumann, G. A., Robinson, M. S. (2014).** Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA. Icarus 243, 78-90. https://doi.org/10.1016/j.icarus.2014.08.013 ; abstract https://elib.dlr.de/94240/ . Published simulation reference; full journal text not inspected.
- **Glaser, P., et al. (2014).** Connecting Ridge - A landing site at the lunar south pole with extended illumination. EPSC Abstracts 9, EPSC2014-136-1. https://elib.dlr.de/94242/ ; open paper https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf . Source of published point coordinates and illumination comparisons.
- **Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T., Torrence, M. H. (2011).** Illumination conditions of the lunar polar regions using LOLA topography. Icarus 211, 1066-1081. https://doi.org/10.1016/j.icarus.2010.10.030 ; NASA abstract https://ntrs.nasa.gov/citations/20120010094 . PSR-method/background reference.
- **Large permanent-shadow distances:** NASA PGDA LOLA product LPSR_80S_20MPP_ADJ_1km2, https://pgda.gsfc.nasa.gov/products/90 . Barker, M. K., et al. (2023), Planetary Science Journal 4, 183, https://doi.org/10.3847/PSJ/acf3e1 ; data https://doi.org/10.60903/gsfcpgda-lola-spole . Only mapped PSRs larger than 1 square kilometre are included.

Other actual coordinate, interface, software and AI-assistance credits remain in A01-A05, F03/F04 and [submission-fields.md](drafts/submission-fields.md).
