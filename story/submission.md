# Project page text

The text for each field of the NASA Space Apps project page, ready to paste.

## Project name

MoonFromEarth

## Team name

Team SBB

## Challenge

Lunar Landing Site Navigator

## High-level summary

With existing tools, each lunar site and date is a separate lookup. MoonFromEarth starts from the mission instead. State how long you stay and how much sunlight, Earth visibility and darkness you can accept, and it checks 18 south pole sites hour by hour from 2027 to 2040 and returns the sites and arrival dates that work.

It is built on NASA/JPL Horizons Sun and Earth positions and LRO LOLA terrain. One table compares every site by sunlight (power), Earth visibility (radio) or both. Selecting a site and hour shows the Sun and Earth against the real terrain skyline, with countdowns to sunset and Earthset, so each number has a visible reason.

The reason matters. A ridge near Shackleton is sunlit for 90.6% of 2027, yet goes dark for 162 hours in a row in May. A point 2.1 km away gets no Sun at all that month. A guided tour, led by a small astronaut guide, walks educators and the public through that story in five steps. Planners get adjustable requirements, share links and CSV export.

Results describe Sun and Earth visibility. Spacecraft power, radio performance and landing safety need further engineering assessment.

## Project demo link

https://www.moonfrom.earth/deck.pdf

## Final project link

https://www.moonfrom.earth/

## Detailed project description

### Start from the mission

A lunar location cannot be understood from a map position or an annual sunlight percentage alone. A solar-powered mission needs to know when sunlight is available, how long darkness lasts and when Earth is visible for a direct radio link. Those conditions change sharply between nearby points and over time.

The challenge names complicated interfaces as the barrier: with existing tools, each site and date is a separate lookup. MoonFromEarth turns the question around. A planner states what the mission needs, and the tool searches 18 south pole sites and 14 years of hourly data for the places and arrival dates that fit. An educator opens a guided tour and sees why two points 2.1 km apart have opposite lighting.

It does three connected jobs: compare sites and dates in one table, show the physical reason behind each number, and check a whole mission stay against explicit requirements.

### Compare locations in the same table

The table is the comparison tool. Prepared sites are shown against the same month, with separate sunlight and Earth-visibility lanes. Users can open a day to inspect its hours and sort the prepared sites by:

- **Power:** most hours with some sunlight.
- **Comms:** most hours with Earth visible.
- **Both:** most hours when the Sun and Earth are visible together.

Selecting a site and hour updates a horizon panorama showing the Sun and Earth against the skyline, charts showing how far each body clears the terrain, and rise/set countdowns. Playback and a slider show how conditions evolve. These linked views give the changing numbers a physical explanation.

The selected-site card adds terrain context: slope from a 30 m LOLA grid, distance to the nearest mapped permanently shadowed region larger than 1 square kilometre, and sunlight at 2 m and 10 m observer heights for 2027-2030.

Users can choose a prepared site, enter coordinates, or click empty ground on the polar map. Five past landing locations give context on the same dates. Custom and past-landing points are evaluated on a smooth Moon, so they are labelled and listed apart from the terrain-aware south pole sites.

### Check the mission's whole stay

The mission planner answers one question: which prepared locations have an arrival time that meets the mission's requirements?

Users set the length of stay, the minimum share of that stay with the Sun and with Earth visible, and the longest continuous darkness allowed. Three editable presets give a starting point.

The planner checks every candidate arrival hour, including sunlight at arrival and enough remaining data for the whole stay. It ranks terrain-aware sites by the number of days containing at least one qualifying arrival hour, and shows the next qualifying time and a 14-year timeline of eligible days. A slip margin shows how many days the arrival can move and still qualify, which is the question a planner asks when a launch date slips.

The search is an explicit numerical calculation. Every result can be traced to the requirements and the hourly data. No AI model produces the ranking.

### A decision the calculation can explain

Take the Short lander preset: a 14-day stay, at least 80% of its hours with the Sun visible, at least 50% with Earth visible, no continuous darkness longer than 24 hours, and sunlight at arrival.

For arrival at 00:00 UTC on 1 May 2027, the 336-hour stay ends at 00:00 UTC on 15 May, excluding that endpoint. Running the planner calculation on the committed hourly records gives:

| Result for the same 14-day stay | Lit ridge near Shackleton | Best-lit point on Connecting Ridge |
| --- | --- | --- |
| Sun visible | 296 h (88.1%) | 230 h (68.5%) |
| Earth visible | 300 h (89.3%) | 300 h (89.3%) |
| Longest darkness during the stay | 21 h | 81 h |
| Sun visible at arrival | Yes | No |
| Meets these visibility requirements | Yes | No |

Both points have the same Earth-visibility hours for this stay. The Connecting Ridge point fails the sunlight and darkness thresholds and has no sunlight at arrival. The Shackleton ridge meets every condition.

The coordinates are latitude -89.43865, longitude -137.49989 for the Shackleton ridge, and latitude -89.4739, longitude -137.3158 for Connecting Ridge, in degrees with east-positive longitude.

### Two points about 2 km apart

The Shackleton ridge and a shadowed point at latitude -89.36899, longitude -136.5882 are about 2.1 km apart. For May 2027, both use the same 2 m observer height, terrain method and UTC window: 1 May 00:00 through 31 May 23:00, or 744 hourly samples.

| Modelled May 2027 result | Lit ridge near Shackleton | Shadowed point near Shackleton |
| --- | --- | --- |
| Sun visible | 512 h (68.8%) | 0 h |
| Earth visible | 457 h (61.4%) | 0 h |
| Sun and Earth visible together | 436 h (58.6%) | 0 h |
| Longest dark interval within the month | 162 h (6.75 days) | All 744 h |

Across 2027, the ridge has sunlight at 7,936 of 8,760 hourly samples, or 90.6%. That high annual percentage still includes the 162-hour dark interval in May. Location, total availability and uninterrupted availability are three different questions, and a mission window has to be checked against all of them.

### A guide for first-time visitors

The guided tour tells that story in five steps and ends at Apollo 11 for contrast. Each step selects the site and month it talks about, the part of the page it points at stays lit while the rest dims, and on a laptop screen the tour card moves next to it. A small astronaut guide stands by the card, greets the visitor and points them to the About page at the end. A test recomputes every number in the tour text from the data files.

Every panel carries a one-sentence caption, and the About panel explains how to read the screen. Share links preserve a selected site and time, and CSV export gives the site's hourly data for inspection.

### NASA inputs, team processing, visible results

[NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) supplies hourly Sun and Earth directions. LRO LOLA south pole digital elevation models, accessed through [NASA Moon Trek](https://trek.nasa.gov/moon/), supply the surrounding terrain.

The team calculates a skyline in 360 directions, accounting for lunar curvature. It uses 5 m or 30 m terrain products near the site and a coarser representation farther away, out to 150 km. The standard observer is 2 m above local ground. A body counts as visible at a sampled hour when any part of its apparent disc clears the terrain horizon; no atmospheric refraction is applied.

Those calculations become hourly records and daily summaries. The website turns them into the table, panorama, charts and mission-window search. NASA data drives both the comparison and its explanation; site selection, processing and the connected workflow are the team's contribution.

The prepared dataset contains 18 terrain-aware south pole points with hourly data for 2027-2040. LOLA also supplies the map relief. Distances to large permanent shadows use NASA PGDA's LOLA polygon product, with Barker et al. (2023) credited for the data.

### Evidence and scientific limits

The repository includes checks for coverage, visibility values and agreement between hourly and daily totals. The May totals above were recounted from the committed hourly records. The 14-day example uses the same calculation as the implemented planner.

Separate stored pipeline benchmarks are compared with Glaser and colleagues' [published Connecting Ridge study](https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf). At two published 10 m locations, the project's 2027 sunlit fractions differ from the reported multi-year results by about 0.3-0.4 percentage points. At the two 2 m benchmark locations, differences are larger: about 5.6 and 8.1 points. A further team check taking the maximum within a 20 m neighbourhood still leaves gaps of approximately 5.1 and 5.3 points at 2 m. It therefore does not resolve the discrepancy. Terrain products and time coverage differ; the cause has not been established. These comparisons do not establish a general accuracy percentage or a complete replication.

What the results are, and are not:

- **Visibility, not engineering budgets.** Sun visibility is not an electrical-power or thermal calculation. Earth visibility is not a radio-link budget or confirmation that a particular ground station can communicate.
- **Model outputs, not observations.** Hourly sampling and finite terrain resolution limit precision, and terrain errors are not propagated.
- **Team-computed points.** The computed sites come from the team's terrain scan. NASA has not designated them as landing sites, and a region centre does not describe every location in its region.
- **No suitability score.** Sort labels and planner results describe modelled visibility. They do not assess every terrain hazard, spacecraft constraint or trajectory needed to approve a landing. Planner presets are editable assumptions, and the slip margin is flexibility inside the visibility window, not a launch-trajectory calculation.
- **Terrain indicators.** Slope describes terrain at a 30 m scale, not roughness beneath a lander. The shadow-distance product excludes shadows smaller than 1 square kilometre and does not confirm water ice. A point shadowed in the simulation is not automatically permanently shadowed. The map relief uses illustrative lighting, not real-time sunlight.
- **Smooth-Moon points.** Custom and past-landing points have no local terrain and are never ranked against the terrain-aware sites.
- **Year boundaries.** Stored annual summaries cut a dark spell at each New Year. The selected-site verdict and the planner use joined hourly data, so a spell across New Year stays whole. Spells are still cut at the start of 2027 and the end of 2040.
- **Not yet measured.** Educational outcomes, task-time improvements and professional adoption.

### Built with

The website uses Next.js, React and TypeScript with Tailwind and UI components. Python prepares the scientific data. The next steps would be further validation at the standard 2 m height and observing first-time users.

Source code: https://github.com/nitrimandylis/lunar-navigator

## Use of artificial intelligence

Yes. Claude Code (Anthropic) assisted with writing and editing the website, the data-processing scripts, the tests and the documentation, working from the team's instructions. We also made the slide deck with Claude: we chose the story, the slide split and the wording, and Claude Code captured the screenshots from the site and laid out the slides. The automated pull-request review also uses Claude Code, after deterministic checks. The Claude models used were Claude Sonnet 5.5, Claude Opus 5.5 and Claude Fable 5.2. ChatGPT and Codex (OpenAI) assisted with reading the rules, source synthesis and drafting this submission text, using GPT-6.1 Sol.

The scientific workflow uses NASA positions and terrain. Table sorting and mission-window rankings are explicit numerical calculations, not AI-generated recommendations. No AI model runs when the website is used.

One image is AI-generated: the team logo on slide 1 of the deck, made with GPT Image 2 and carrying a visible "AI-generated" mark. The astronaut tour guide is not an image-model output: it is a vector drawing written as code with Claude Code, and the deck says so. There is no AI-generated video or audio. The map relief is computed from LOLA data.

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
- Slide deck: one HTML file printed to PDF with headless Chromium, set in the site's fonts (Excon and JetBrains Mono), with screenshots taken from the running site through [Playwright](https://playwright.dev/). The team logo on slide 1 was generated with GPT Image 2 (OpenAI) and is marked as AI-generated. The tour guide on slides 1 and 7 is the site's own vector drawing.
- Exact dependency declarations and the project licence are recorded in the repository: https://github.com/nitrimandylis/lunar-navigator
