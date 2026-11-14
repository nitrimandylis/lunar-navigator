# Remaining submission fields - working drafts

> **DRAFT - preparation only. Not approved for submission.**

Updated: 14 November 2026, following Nick's feature-status clarification.
Only the text between **DRAFT TEXT - START** and **END OF DRAFT TEXT** is proposed form content. All instructions, questions and evidence-review notes are below that boundary. Square-bracket values are unfilled draft fields, not questions to copy into the final submission.

The [summary](high-level-summary.md) and [detailed description](detailed-description.md) have separate files. The [slide-deck placeholder](slide-deck.md) remains completely empty.

---

## DRAFT TEXT - START

### Project identification

Project name: [FINAL PROJECT NAME]

Team name: [FINAL TEAM NAME]

Selected challenge: Lunar Landing Site Navigator

Member credits: [PERMITTED MEMBER CREDITS]

### NASA data

Our prepared 2027 dataset combines NASA/JPL Horizons Sun and Earth positions with lunar terrain derived from LRO LOLA elevation models obtained through NASA Moon Trek. Horizons provides hourly directions of the Sun and Earth from the lunar points; saved responses identify the DE441 ephemeris and no atmospheric refraction. The LOLA products provide surrounding topography for the team's terrain-horizon calculation. Comparing the apparent Sun and Earth discs with that horizon produces hourly visibility values and daily summaries for 18 prepared points.

The terrain products reported in the data handoff are LRO_LOLA_DEM_SPole875_5mp_v04.tif (5 m pixels) and LRO_LOLA_DEM_SPole75_30mp_v04.tif (30 m pixels). The horizon uses terrain out to 150 km and a fixed 2 m observer height above local ground. Custom-point estimates in the documented method use a smooth-Moon horizon and need to be distinguished from the terrain-aware prepared points.

- NASA/JPL Horizons: https://ssd.jpl.nasa.gov/horizons/
- Horizons documentation: https://ssd.jpl.nasa.gov/horizons/manual.html
- NASA Moon Trek, access point for the terrain products: https://trek.nasa.gov/moon/
- NASA LRO LOLA instrument background: https://science.nasa.gov/mission/lro/lola/

### Space agency partner data and other references

Additional space agency partner datasets: [COMPLETE FROM VERIFIED TEAM INVENTORY]

Other references and resources recorded for the project:

- LROC / Mark Robinson, IM-2 intended landing-point coordinates: https://lroc.im-ldi.com/images/1401
- Lunar Resources Registry south pole map, candidate-region centre coordinates and Connecting Ridge search starting area: https://lunarresourcesregistry.com/south-pole-map/
- IAU/USGS Gazetteer of Planetary Nomenclature, crater names and locator-map outline inputs: https://planetarynames.wr.usgs.gov/
- Glaser et al. (2014), Icarus 243, 78-90, literature reference recorded for the Connecting Ridge plausibility check: https://elib.dlr.de/94242
- Excon, Indian Type Foundry via Fontshare, interface text: https://www.fontshare.com/fonts/excon
- JetBrains Mono, JetBrains via Google Fonts, interface numbers: https://fonts.google.com/specimen/JetBrains+Mono
- Documented website tools: Next.js, TypeScript, Tailwind CSS, shadcn/ui and npm.
- Reported data preparation/testing tools: Python, NumPy, Rasterio, Requests and pytest.
- Other libraries, lunar-map imagery, icons, external code/text and assets: [COMPLETE EXACT SOURCES, ATTRIBUTION AND APPLICABLE RIGHTS]

### Super Intelligence / AI use

Yes. ChatGPT/Codex assisted with reviewing sources, synthesising research and drafting Markdown presentation/submission preparation. Gio's data handoff reports that Claude Code assisted with writing the data scripts and the handoff document.

Other development, testing, design, research or media-generation assistance: [COMPLETE WHOLE-TEAM TOOL AND USE INVENTORY]

An AI feature for identifying promising locations and times is planned. Its selection criteria are still being decided; its provider/model, data inputs, implemented behaviour and verification need to be reflected in the final disclosure if the feature is included.

Completed human checking and review: [DESCRIBE ACTUAL CHECKS AND REVIEW ONLY]

### Public links

Project demo: [FINAL PUBLIC SLIDE-DECK URL]

Final project: [FINAL PUBLIC WEBSITE OR PROJECT URL]

Supporting repository: https://github.com/nitrimandylis/lunar-navigator

NASA project page: [TEAM NASA PROJECT-PAGE URL]

## END OF DRAFT TEXT

---

## TEAM NOTES AND QUESTIONS - DO NOT SUBMIT

**Everything below this heading is preparation material, not form content.**

### Project identification - questions

- What are the final project/team names? Lunar Navigator is a working name in existing preparation documents, not a newly confirmed final name.
- Candidate tagline for discussion only: Explore lunar conditions by site and date.
- Who will enter the approved form answers?
- Has an organiser clarified permitted written credits for under-18 members? See [the unresolved distinction](../nasa-rules-and-rubric.md#under-18-names-unresolved-distinction). Do not invent an approved credit format.

### NASA data - questions and source limits

- **Gio:** confirm final data revision, exact product-access/download references, rights and build provenance.
- **Gio/trim:** do custom-coordinate/map-click points still lack local terrain horizons, or do they map to prepared points? The draft follows [F01](../sources.md#f01) until corrected.
- Confirm that the final website exposes the described data. [F02](../sources.md#f02) supports site/date selection, but does not certify every metric or scientific output.
- Do not list QuickMap as an implemented feed or completed validation tool on the current evidence.
- The NASA LOLA instrument page is background; it is not the product-download reference or a separate analytical input.

Basis: F01 sections 1-4, 8-9; existing [T01-T03](../sources.md#t01); [N02](../sources.md#n02), p. 8; [N05](../sources.md#n05), qualifying challenge resources.

### Other references - questions and source limits

- **Whole team:** were any additional space-agency partner datasets actually used? None is established in the reviewed evidence; complete the field accurately.
- **Gio:** recheck the original IM-2 and third-party region-centre coordinate references. A region centre is not a precise official landing point or a model of the entire region.
- **Gio/trim:** reconcile Gazetteer access paths for the separate uses. [A03](../sources.md#a03) reports direct Gazetteer use for locator outlines; F01 reports scan starting points through Wikipedia.
- **Gio:** check the original Glaser paper before quoting literature values as verified. F01's author did not reread it. The draft gives the reference without claiming replication or a verified accuracy percentage.
- **Whole team:** complete the map imagery, icon, library and other resource inventory with exact links and applicable rights. No 3D Moon asset is assumed; the 3D feature is removed from scope.
- Existing font credits come from trim's recorded [A01](../sources.md#a01) and [A02](../sources.md#a02); confirm the final asset inventory and licences.
- Tool/library URLs and attribution need completion from the final inventory; merely naming the stack does not finish the credits.
- Use original public URLs. Research about other participants remains credited communication background and is not our project data or implemented work.

Basis: F01 sections 5, 7 and 9 and its unverified list; A01-A03; [N02](../sources.md#n02), p. 9.

### AI use - questions and final checks

- **Trim/gio/whole team:** what exact tools and model names were used, for which tasks, and what human checking was actually completed?
- **Team:** who established the original solution concept, and how did assistance contribute? Do not invent an originality declaration or claim all outputs were independently verified.
- **Team:** what does the planned AI feature actually search or calculate, with which inputs, criteria and provider/model? Its presence in the final project must be reflected in the final tool inventory and disclosure.
- Complete any applicable visible acknowledgements and metadata for generated code/data. Inventory any generated images, video or audio and follow [N02 p. 8](../sources.md#n02).
- The guide states that this particular form response is not shown to judges, while generated-content indicators within the project are visible. The form answer does not replace those indicators.
- No generated imagery or audio is created by this Markdown drafting work.

### Public links - questions and final checks

- What are the team's website and NASA project-page URLs?
- The chosen demo is an English deck of at most seven slides total. No video is being prepared.
- The empty slide-deck Markdown file is a placeholder, not a finished demo.
- Test the final deck/project links while signed out. They must not require permission, a password or registration.
- Confirm the repository revision and the intended final entry point. A draft PR is not the project demo.
- Inspect the actual live form for required fields, available options and limits; this writing task has not audited it.
- Replace all placeholders and obtain team agreement before copying answers.
- Submit the approved final project through NASA's form and verify the submission confirmation. Markdown drafts and a GitHub PR do not submit the NASA entry.

Basis: [N02](../sources.md#n02), pp. 6-9 and 12; [submission-page guide](../submission-page-guide.md). Current feature status follows [F02](../sources.md#f02); calculations follow [F01](../sources.md#f01). NASA rules remain the authority for submission requirements.
