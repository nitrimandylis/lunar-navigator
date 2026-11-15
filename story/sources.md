# Sources and credits

Everything the project uses that the team did not make, and what each one is used for.
Checked on 15 November 2026: every link below opened.

The dated working log behind this list is in [`notes/sources.md`](notes/sources.md).

## NASA data

| Source | Used for |
| --- | --- |
| [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) (ephemeris DE441, through its [web API](https://ssd.jpl.nasa.gov/api/horizons.api); [manual](https://ssd.jpl.nasa.gov/horizons/manual.html)) | Where the Sun and Earth are in each site's sky, every hour from 2027 to 2040. Also the sub-solar and sub-Earth points and the Earth-Moon distance, used for custom points and past landings. |
| LRO LOLA DEM v4, South Pole, downloaded through [NASA Moon Trek](https://trek.nasa.gov/moon/): `LRO_LOLA_DEM_SPole875_5mp_v04.tif` (5 m) and `LRO_LOLA_DEM_SPole75_30mp_v04.tif` (30 m) | The terrain skyline around each site (360 directions, out to 150 km), site elevations, ground slope, and the shaded relief under the map. The relief is lit by a made-up light, not the real Sun. The raw files are not in the repository. |
| [NASA PGDA product 90](https://pgda.gsfc.nasa.gov/products/90), "A New View of the Lunar South Pole from LOLA": `LPSR_80S_20MPP_ADJ_1km2` ([data DOI](https://doi.org/10.60903/gsfcpgda-lola-spole)) | Distance from each site to the nearest permanently shadowed region of at least 1 km2. |
| [NASA NSSDCA, Table of Anthropogenic Impacts and Spacecraft on the Moon](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html) | Coordinates of the five past landings shown for comparison: Apollo 11, Blue Ghost Mission 1, SLIM, Chandrayaan-3 and Chang'e 6. |
| [LOLA instrument page](https://science.nasa.gov/mission/lro/lola/) | Background on the instrument. |

## Published work we compare against or cite

- Gläser, P., Scholten, F., De Rosa, D., et al. (2014). *Connecting Ridge: a landing site at
  the lunar south pole with extended illumination.* EPSC Abstracts 9, EPSC2014-136-1.
  [Paper](https://elib.dlr.de/94242/1/EPSC2014-136-1.pdf). Source of the four published points
  and Sun percentages in our benchmark (`data/KNOWN-ANSWERS.md`). We read the full two pages.
- Gläser, P., Scholten, F., De Rosa, D., et al. (2014). *Illumination conditions at the lunar
  south pole using high resolution Digital Terrain Models from LOLA.* Icarus 243, 78-90.
  [DOI](https://doi.org/10.1016/j.icarus.2014.08.013), [abstract](https://elib.dlr.de/94240/).
  We read the abstract only.
- Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T., Torrence, M. H. (2011).
  *Illumination conditions of the lunar polar regions using LOLA topography.* Icarus 211,
  1066-1081. [DOI](https://doi.org/10.1016/j.icarus.2010.10.030),
  [NASA record](https://ntrs.nasa.gov/citations/20120010094). Background for the horizon
  method. We read the abstract only.
- Barker, M. K., et al. (2023). Planetary Science Journal 4, 183.
  [DOI](https://doi.org/10.3847/PSJ/acf3e1). The citation the PGDA product asks for.

## Site coordinates

- **IM-2 landing site:** LROC team, M. Robinson, 26 February 2025,
  [lroc.im-ldi.com/images/1401](https://lroc.im-ldi.com/images/1401).
- **Artemis III candidate regions and the Connecting Ridge search area:** region centres from
  the [Lunar Resources Registry south pole map](https://lunarresourcesregistry.com/south-pole-map/).
  A region centre is not an official landing point.
- **Crater names, centres and diameters:** IAU
  [Gazetteer of Planetary Nomenclature](https://planetarynames.wr.usgs.gov/), hosted by USGS.
  The map outlines were read from the Gazetteer. The data scans took their starting crater
  centres from Wikipedia pages that quote it.
- **All other sites** are points our own scans found on the LOLA terrain
  (`data/rim_search.py`, `data/repick_pair.py`). They are not official landing sites.

## Interface

- [Excon](https://www.fontshare.com/fonts/excon), Indian Type Foundry, from Fontshare: all text.
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), from Google Fonts, SIL
  Open Font License 1.1: numbers.
- [Lucide](https://lucide.dev/) icons, ISC licence.

Both fonts load from their CDN stylesheets. No font files are in the repository.

## Software

- **Website:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Base UI,
  class-variance-authority, cn, tw-animate-css. Checks: ESLint and the Node test runner.
- **Data:** Python with NumPy, Rasterio and Requests. Checks: pytest.
- Exact versions are in `package.json` and `data/requirements.txt`.

## Slide deck

- Built with pptxgenjs and sharp, converted to PDF with LibreOffice. Its screenshots were
  taken from the live site with Playwright. Text is set in Helvetica Neue.
- The layout helpers (functions that place text boxes and images) come from a slide kit one
  team member wrote in October 2026, before the hackathon. No project code, data or content
  comes from it.
- The team logo on slide 1 was generated with GPT Image 2 and carries a visible
  "AI-generated" mark. It is the only AI-generated image in the project.

## AI assistance

- **Claude Code (Anthropic)** wrote and edited most of the website code, the data scripts,
  the tests and the documentation, working from our instructions. It also built the slide
  deck with us and reviews every pull request after the automated checks.
- **ChatGPT and Codex (OpenAI)** helped with reading the rules, drafting the submission text
  and keeping these notes.
- The site ranks, sorts and plans with plain arithmetic on NASA data. Nothing a user sees is
  produced by an AI model at run time.
- What we checked ourselves: we chose the sites, the features and the story, tested each
  feature in the browser, and read the results and the benchmark tables. We did not read
  every line of generated code. The automated tests (134 for the website, plus the pytest suite
  for the data) and the benchmark against Gläser et al. cover the rest.
