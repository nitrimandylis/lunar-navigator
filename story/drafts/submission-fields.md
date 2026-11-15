# Remaining submission fields - revised working drafts

> **DRAFT - preparation only. Not approved for submission.**

Revised: 15 November 2026. Evidence snapshot: dbec867, with Nick's latest coverage confirmation.
Only the section between **DRAFT TEXT - START** and **END OF DRAFT TEXT** is proposed form content. Square brackets identify final identifiers/links still needed. Notes and remaining questions follow the boundary.

The [summary](high-level-summary.md) and [detailed description](detailed-description.md) have their own files. The [slide-deck placeholder](slide-deck.md) remains empty.

---

## DRAFT TEXT - START

### Project identification

Project name: Lunar Landing Site Navigator

Team name: [FINAL TEAM NAME]

Selected challenge: Lunar Landing Site Navigator

Member credits: [APPROVED MEMBER CREDITS]

### NASA data

NASA information is the basis of the project's visibility calculations. NASA/JPL Horizons supplies hourly Sun and Earth directions at lunar locations, and sub-solar/sub-Earth positions and Earth-Moon distances used for smooth-Moon estimates. LRO LOLA elevation data supplies the terrain needed to determine whether surrounding ground blocks the view.

The team uses LRO LOLA DEM v4 south pole products obtained through NASA Moon Trek: LRO_LOLA_DEM_SPole875_5mp_v04.tif (5 m pixels) and LRO_LOLA_DEM_SPole75_30mp_v04.tif (30 m pixels). A skyline is calculated around each prepared point, accounting for lunar curvature and terrain out to 150 km, with a standard observer height of 2 m. Sun and Earth are treated as apparent discs. Hourly visibility becomes availability totals and the numerical mission-window search.

The current prepared dataset contains 18 south pole points with hourly records for 2027-2040. Custom and past-landing points use a smooth-Moon model without local terrain and are kept separate from terrain-aware rankings. The separate 10 m observer-height summary currently covers 2027-2030.

Ground slope is derived from the 30 m LOLA terrain. Distance to large permanently shadowed regions uses NASA PGDA's LPSR_80S_20MPP_ADJ_1km2 polygon product, restricted to regions larger than 1 square kilometre. It is distance to a mapped shadow boundary, not evidence of water ice, resource accessibility or landing safety.

NASA NSSDCA's Table of Anthropogenic Impacts and Spacecraft on the Moon supplies coordinates for five past-landing reference locations. LOLA also supplies the map relief; its illustrative shading is not real-time sunlight.

- NASA/JPL Horizons: https://ssd.jpl.nasa.gov/horizons/
- Horizons documentation: https://ssd.jpl.nasa.gov/horizons/manual.html
- Horizons API: https://ssd.jpl.nasa.gov/api/horizons.api
- NASA Moon Trek, access point for the terrain products: https://trek.nasa.gov/moon/
- LRO LOLA instrument background: https://science.nasa.gov/mission/lro/lola/
- NASA NSSDCA coordinate table: https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html
- NASA PGDA, A New View of the Lunar South Pole from LOLA, product 90: https://pgda.gsfc.nasa.gov/products/90 ; data DOI: https://doi.org/10.60903/gsfcpgda-lola-spole

### Space agency partner data and other references

The documented analytical inputs are the NASA resources above. Other recorded resources and tools are:

**Location and literature references**

- LROC / Mark Robinson, IM-2 intended landing-point reference: https://lroc.im-ldi.com/images/1401
- Lunar Resources Registry south pole map, region centres and Connecting Ridge search starting area: https://lunarresourcesregistry.com/south-pole-map/
- IAU/USGS Gazetteer, crater names and locator outlines; data scans used Gazetteer-derived crater starting coordinates via Wikipedia: https://planetarynames.wr.usgs.gov/
- Glaser et al. (2014), Connecting Ridge - A landing site at the lunar south pole with extended illumination, EPSC2014-136-1; published point coordinates and sunlit-time benchmarks: https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf
- Glaser et al. (2014), Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA, Icarus 243, 78-90; journal abstract: https://elib.dlr.de/94240/ ; DOI: https://doi.org/10.1016/j.icarus.2014.08.013
- Mazarico et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066-1081; PSR-method reference, not a completed matched validation of our tool: https://doi.org/10.1016/j.icarus.2010.10.030 ; NASA record: https://ntrs.nasa.gov/citations/20120010094
- Barker et al. (2023), Planetary Science Journal 4, 183; citation requested by the NASA PGDA product page for its LOLA south pole products: https://doi.org/10.3847/PSJ/acf3e1 ; data DOI: https://doi.org/10.60903/gsfcpgda-lola-spole

**Interface assets**

- Excon, Indian Type Foundry via Fontshare, interface text: https://www.fontshare.com/fonts/excon
- JetBrains Mono, JetBrains via Google Fonts, interface numbers: https://fonts.google.com/specimen/JetBrains+Mono
- Lucide, interface icons: https://lucide.dev/
- South pole hillshade: LRO LOLA DEM v4 South Pole (30 m and 5 m), NASA Moon Trek. Rendered by the team's data preparation into basemap.png and basemap-87.5.png with artificial illustrative lighting.

**Software and development tools**

- Website: [Next.js](https://nextjs.org/), [React/React DOM](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn](https://ui.shadcn.com/), [Base UI](https://base-ui.com/), [class-variance-authority](https://www.npmjs.com/package/class-variance-authority), [cn](https://www.npmjs.com/package/cn) and [tw-animate-css](https://www.npmjs.com/package/tw-animate-css); [npm](https://www.npmjs.com/) for packages and [ESLint](https://eslint.org/) for checks.
- Data preparation/checks: [Python](https://www.python.org/), [NumPy](https://numpy.org/), [Rasterio](https://rasterio.readthedocs.io/), [Requests](https://requests.readthedocs.io/) and [pytest](https://docs.pytest.org/).
- AI-assisted development/writing: [Claude Code](https://code.claude.com/docs/en/overview) (Anthropic) and [ChatGPT](https://chatgpt.com/)/[Codex](https://openai.com/codex/) (OpenAI), described below.
- Exact dependency declarations and the project licence are recorded in the repository: https://github.com/nitrimandylis/lunar-navigator

### Super Intelligence / AI use

Yes. Claude Code assisted with writing/editing the website, data-processing scripts, tests and documentation. The automated PR-review workflow also uses Claude Code after deterministic checks. ChatGPT/Codex assisted with research, source synthesis, presentation/submission drafting and repository coordination.

The scientific workflow uses NASA positions and terrain. Current table sorting and mission-window rankings are explicit numerical calculations, not AI-generated recommendations. A further AI feature is under consideration and is not described as implemented.

Teammates report no AI-generated images, video or audio. The map hillshade is computed from LOLA data.

### Public links

Project demo: [FINAL PUBLIC SLIDE-DECK URL]

Final project: [FINAL PUBLIC WEBSITE OR PROJECT URL]

Supporting repository: https://github.com/nitrimandylis/lunar-navigator

NASA project page: [TEAM NASA PROJECT-PAGE URL]

## END OF DRAFT TEXT

---

## TEAM NOTES AND QUESTIONS - DO NOT SUBMIT

**Everything below this heading is preparation material, not form content.**

### Answers incorporated

- [F03](../sources.md#f03) supplies trim's app-side answers, assets and assistance. [F04](../sources.md#f04) supplies gio's provenance, tools and assistance. Both are dated snapshots.
- [F05](../sources.md#f05) records the earlier table, Both sorting, planner, four-year coverage, map relief, validation display and dependency inventory. [F08](../sources.md#f08) updates it to the newer data and terrain indicators.
- [F06](../sources.md#f06) is an earlier scope snapshot; [F07](../sources.md#f07) supersedes its planned-2040 statement with working coverage and the corrected data-credit handoff. AI remains under consideration, the interface shared, and comparison in the table.
- A01-A05 in [sources.md](../sources.md#a01) retain actual asset credits. Fonts load through CDN stylesheets.
- T04/T05 correct the Glaser citation: 94242 is the EPSC paper; 94240 is the Icarus record. The conference paper and journal abstract were read, not the full journal article.

### Questions - answer below each question only

Please add `Answer - name, date:` below the relevant question. Leave the draft text and question unchanged; Nick will incorporate agreed answers. The latest NASA-data and literature credits are incorporated; no repeat source handoff is needed.

1. **S1 - Nick:** What is the NASA team project-page URL, and what written member-credit format has the organiser approved for under-18 members? Final project/team names are asked once as H1 in the summary. The deck URL can wait until deck preparation.

   Answer - Nick, date: Pending.

2. **S2 - Trim (nitrimandylis):** What stable public website URL should judges open? Has it been checked while signed out, including shared links and CSV export? Please give the checked revision/date. Full-range UI evidence is asked once as D2 in the detailed description.

   Answer - Trim, date: Pending.

3. **S3 - Trim (nitrimandylis):** Are the app's final font, icon, package and other external-asset credits complete, and have applicable permissions/licence conditions been checked? Please name any resources added since the handoff. The source register now includes the supplied NASA-data and paper credits; this question concerns remaining final attribution confirmation.

   Answer - Trim, date: Pending.

4. **S4 - Trim (app/review workflow) and Gio (data work):** For your respective work, is the AI-use account above accurate, what human checking actually took place, and where are the required descriptive acknowledgements/metadata? Add any later assistance; do not invent model versions or imply that a review happened when it did not. A runtime AI provider belongs here only if that feature is delivered.

   Answer - Trim, date: Pending.

   Answer - Gio, date: Pending.

### Credit completion and release checks

- Exact tool/resource URLs and the supplied data-credit blocks are included above and in [sources.md](../sources.md). The links identify credited resources; they do not claim that a fresh licence audit was performed. Check the final inventory for later additions.
- No separate partner-agency dataset is established by the reviewed inventory. Add the exact resource and role if one was used.
- Prepared data cover 2027-2040. Keep the separate 2027-2030 10 m summary labelled with its actual period. Trim's final interface/export evidence remains D2, not a request for more data from Gio.
- The interface is currently shared. AI is undecided. Table comparison and numerical mission planning are delivered capabilities in the reviewed snapshot.
- Test final links while signed out, record a final revision and capture real screenshots. Replace all identifiers/link placeholders and obtain team agreement.
- Apply [N02](../sources.md#n02), p. 8, for applicable AI indicators/metadata. The hidden form response does not replace visible project acknowledgements.
- Make legal/original-work declarations only when accurate. Complete NASA's actual submission action and check confirmation.
- The chosen demo is an English deck of at most seven slides; no video is being prepared. The empty Markdown file is a placeholder.

Field/rule basis: [N02](../sources.md#n02), pp. 6-9 and 12; [N05](../sources.md#n05); [N01](../sources.md#n01), pp. 5-7; [submission-page guide](../submission-page-guide.md). The live form's required fields, options and limits govern the final hand-in.
