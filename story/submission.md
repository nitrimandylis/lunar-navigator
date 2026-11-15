# Project page text

The text for each field of the NASA Space Apps project page, ready to paste.

## Project name

Lunar Landing Site Navigator

## Team name

Team SBB

## Challenge

Lunar Landing Site Navigator

## High-level summary

A ridge near Shackleton has sunlight at 90.6% of 2027's hourly samples, yet experiences 162 consecutive hours of darkness in May. Choosing a lunar landing site requires understanding when those interruptions occur and whether a mission can tolerate them.

Lunar Landing Site Navigator turns NASA/JPL Horizons Sun and Earth positions and LRO LOLA terrain into a website connecting site comparison, physical explanation and a search for arrival times that meet a mission's needs. Users compare south pole sites in one table, sorting by sunlight, Earth visibility or hours when both are visible. Selecting a site and time updates the horizon view, charts and rise/set countdowns.

The planner checks a proposed stay against minimum sunlight, Earth visibility and maximum continuous darkness. For an illustrative 14-day stay from 1 May 2027, the Shackleton ridge meets the stated requirements while the Connecting Ridge point does not.

Guided explanations help educators and the public understand these differences; adjustable requirements and data export support preliminary mission exploration. Prepared hourly data cover 2027-2040. Results describe visibility and selected terrain indicators; spacecraft power, radio performance and landing safety require further engineering assessment.

## Project demo link

https://www.moonfrom.earth/deck.pdf

## Final project link

https://www.moonfrom.earth/

## Detailed project description

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

The website uses Next.js, React and TypeScript with Tailwind and UI components; Python prepares the scientific data. Prepared data now cover 2027-2040. Further validation at the standard 2 m height and observation of first-time users would strengthen the next iteration.

Source code: https://github.com/nitrimandylis/lunar-navigator

## Use of artificial intelligence

Yes. Claude Code (Anthropic) assisted with writing and editing the website, the data-processing scripts, the tests and the documentation, working from the team's instructions. It also built the slide deck with us: it captured the screenshots from the live site and laid out the slides. The automated pull-request review also uses Claude Code, after deterministic checks. ChatGPT and Codex (OpenAI) assisted with reading the rules, source synthesis and drafting this submission text.

The scientific workflow uses NASA positions and terrain. Table sorting and mission-window rankings are explicit numerical calculations, not AI-generated recommendations. No AI model runs when the website is used.

One image is AI-generated: the team logo on slide 1 of the deck, made with GPT Image 2 and carrying a visible "AI-generated" mark. There is no AI-generated video or audio. The map relief is computed from LOLA data.

What we checked ourselves: we chose the sites, the features and the story, tested each feature in the browser, and read the results and benchmark tables. We did not read every line of generated code; automated tests and a benchmark against published results cover the rest. The repository README and story/sources.md carry the same acknowledgement.

## NASA data

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

## Space agency partner data and other references

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
- AI-assisted development/writing: [Claude Code](https://code.claude.com/docs/en/overview) (Anthropic) and [ChatGPT](https://chatgpt.com/)/[Codex](https://openai.com/codex/) (OpenAI), described in the AI field.
- Slide deck: built with [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) and [sharp](https://sharp.pixelplumbing.com/), converted to PDF with [LibreOffice](https://www.libreoffice.org/), with screenshots taken from the live site through [Playwright](https://playwright.dev/). Text is set in Helvetica Neue. Its layout helpers come from a slide kit one team member wrote in October 2026, before the event; no project code, data or content comes from it. The team logo on slide 1 was generated with GPT Image 2 (OpenAI) and is marked as AI-generated.
- Exact dependency declarations and the project licence are recorded in the repository: https://github.com/nitrimandylis/lunar-navigator
