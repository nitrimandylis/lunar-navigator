# trim's answers for the story draft questions

These are trim's answers to the questions in the "TEAM NOTES AND QUESTIONS - DO NOT SUBMIT" sections of the story drafts. They are kept here because story/ is koum's; koum copies each answer under its question. gio's answers are in data/ANSWERS-FOR-STORY.md.

Everything here was read from the app code on main at 8d9c2e2, not from a live test of the website. "Not yet confirmed" means trim has not decided or checked it yet.

## story/drafts/detailed-description.md

### Questions about location/date selection - trim and gio

Q: 1. Does entering coordinates or clicking the map analyse the exact point or select/snap to a prepared point?

Answer - trim/2026-11-14: The exact point, no snapping. Typed coordinates are used as entered. A map click on empty ground fills the latitude and longitude fields, rounded to 2 decimals (about 300 m on the Moon), and the user presses Add site. Clicking an existing pin selects that prepared site instead. Up to 3 custom points at a time. Agrees with gio's answer.

Q: 2. Do custom points still use a smooth-Moon horizon without local terrain? How does the interface explain the difference?

Answer - trim/2026-11-14: Yes, flat horizon at 0 degrees, worked out in the browser from ephemeris.json. The interface says so in four places: a "Custom points: no terrain" group heading and a "no terrain" tag on each custom row in the grid, "Flat horizon, no terrain." in the Selected site panel, and a note under the custom point form that near the pole terrain decides the light and the curated sites give terrain-aware numbers.

Q: 3. Which metrics are currently visible: Sun hours, Earth hours, simultaneous visibility, solar elevation, darkness gaps or other outputs?

Answer - trim/2026-11-14: Visible now:
- Grid: for every site, each day of the chosen month as a cell with a Sun lane and an Earth lane, shaded by that day's sun_hours and earth_hours; the hover tooltip gives both numbers. A "Month hours" column gives the month totals.
- Opening a day: the selected row shows that day's 24 hours, each marked Sun up/down and Earth in view/out of view.
- Selected site panel: Sun elevation and Earth elevation at the selected hour, time to sunset (or sunrise) and time to Earthset (or Earthrise).
- Clearance panel: two charts, Sun and Earth, of how far each body is above the terrain horizon, every hour of the month.
- Month chips: a Sun lane and an Earth lane under each month, shaded by the selected site's monthly hours.

Not shown: simultaneous Sun-and-Earth hours, max solar elevation per day, and longest dark spell. They exist in the data only.

Q: 4. What date/time inputs and intervals does the working interface support within the 2027 data? Do not infer arbitrary ranges from the hourly dataset.

Answer - trim/2026-11-14: Calendar year 2027 only, fixed, in UTC. Inputs: 12 month buttons (January to December), click a day cell to open that day, click an hour cell to pick the hour. The smallest step is one hour. There is no free date/time text field and no range picker. Changing month keeps the same day of the month and hour of the day.

Q: 5. Once comparison is complete, can the website reproduce the exact May Shackleton example? Record a screenshot, app/data revision and verifier. A data-only metric must not be described as visible in the interface.

Answer - trim/2026-11-14: Partly, from the code. Choosing May shows the ridge's May Sun and Earth hours in the "Month hours" column, and the days of the dark spell (14 to 21 May) show as days with no Sun. The 436 simultaneous hours and the 162-hour gap as a single number are not shown anywhere (see question 3), so they must stay data-only claims. Screenshot, revision and verifier: Not yet confirmed.

### Questions about the planned interfaces - Nick and trim

Q: 1. Which information and controls will the public/educator view show?

Answer - trim/2026-11-14: Not yet confirmed. Today there is one interface, the one described in question 3 above, with no separate views.

Q: 2. Which additional information will the professional view show?

Answer - trim/2026-11-14: Not yet confirmed.

Q: 3. What actual difference will help each audience complete its task? A role selector alone does not demonstrate a benefit.

Answer - trim/2026-11-14: Not yet confirmed.

Q: 4. Keep professional audience labels neutral. A label such as professional or mission planner does not imply NASA endorsement.

Answer - trim/2026-11-14: Agreed. The current interface has no audience labels at all.

### Questions about the planned AI feature - whole team

Q: - What objective will define a preferred option: sunlight, Earth visibility, simultaneous availability, uninterrupted duration, user priorities or something else?

Answer - trim/2026-11-14: Not yet confirmed. The nearest thing built today is a Sort control that orders the sites by most Sun hours ("Power") or most Earth hours ("Comms") in the chosen month. That is plain sorting, not AI.

Q: - What sites, coordinates, dates and time-window lengths can it search? Searching 18 prepared points would not establish a best location everywhere on the Moon.

Answer - trim/2026-11-14: Not yet confirmed. Nothing is built.

Q: - Does an actual numerical search compute the rankings, does an AI model explain them, or is another architecture planned? What provider/model and data inputs will be used?

Answer - trim/2026-11-14: Not yet confirmed. Nothing is built, and no model or provider is chosen.

Q: - How will terrain-aware and smooth-Moon results be handled so they are not silently ranked as equivalent?

Answer - trim/2026-11-14: Not yet confirmed for the AI feature. In the current Sort, custom points sit in their own "Custom points: no terrain" group below the curated sites, so they are not ranked in the same list.

Q: - How will the selected site/time, supporting numbers, constraints and limitations be checked against the underlying data?

Answer - trim/2026-11-14: Not yet confirmed.

Q: - What will it do when no option meets the requirements?

Answer - trim/2026-11-14: Not yet confirmed.

### Questions about benefit and final copy - Nick and the team

Q: - What are the final project/team names?

Answer - trim/2026-11-14: Not yet confirmed. The page title in the app today is "Lunar Landing Site Navigator".

Q: - Has anyone outside the development team tried the site? If yes, record the task, participant type, date, observed result and feedback. No such result is assumed here.

Answer - trim/2026-11-14: Not yet confirmed.

Q: - What is the strongest demonstrated improvement in our workflow? Any faster/easier claim needs actual evidence.

Answer - trim/2026-11-14: Not yet confirmed. No timing or user test has been run.

Q: - Which planned features were completed by submission time? Move only confirmed functions into the available-features section.

Answer - trim/2026-11-14: As of 8d9c2e2: done are the 18 curated sites, custom points (typed or map click), month/day/hour selection, the grid, Selected site panel, Clearance charts, south pole map and Power/Comms sort. The grid already shows every site side by side for the same month; a dedicated pick-two comparison view does not exist. Not built: separate audience views and the AI feature. Final state at submission: Not yet confirmed.

Q: - What are the final public links, permitted member credits and complete AI/asset disclosures?

Answer - trim/2026-11-14: Links and credits: Not yet confirmed. App-side assets are listed under the submission-fields answers below.

## story/drafts/high-level-summary.md

### Questions corresponding to this summary

Q: 2. **Trim:** Does coordinate entry/map clicking analyse the exact selected location or select the nearest prepared data point? The summary currently describes selection only; it does not promise equal terrain coverage for every coordinate.

Answer - trim/2026-11-14: The exact location, no snapping (map clicks are rounded to 2 decimals). Custom points have no terrain, so coverage is not equal: see detailed-description question 1 and 2.

Q: 3. **Nick/trim:** Once completed, which comparison and audience-interface functions should move from planned to working?

Answer - trim/2026-11-14: Side-by-side viewing of all sites for one month, and sorting them by Sun or Earth hours, is working now. A dedicated comparison view and the audience interfaces are not built. What moves at submission: Not yet confirmed.

Q: 4. **Team:** What will the AI optimise, over which sites and times, and how will its suggestions be checked? Until agreed, keep the cautious planned-feature wording.

Answer - trim/2026-11-14: Not yet confirmed. Keep the planned-feature wording.

## story/drafts/submission-fields.md

### NASA data - questions and source limits

Q: - **Gio/trim:** do custom-coordinate/map-click points still lack local terrain horizons, or do they map to prepared points? The draft follows [F01](../sources.md#f01) until corrected.

Answer - trim/2026-11-14: They still lack terrain and do not map to prepared points. The draft is correct.

Q: - Confirm that the final website exposes the described data. [F02](../sources.md#f02) supports site/date selection, but does not certify every metric or scientific output.

Answer - trim/2026-11-14: See detailed-description question 3 for exactly what is shown. Simultaneous hours, max solar elevation and the longest dark spell are not shown.

### Other references - questions and source limits

Q: - **Gio/trim:** reconcile Gazetteer access paths for the separate uses. [A03](../sources.md#a03) reports direct Gazetteer use for locator outlines; F01 reports scan starting points through Wikipedia.

Answer - trim/2026-11-14: App side: the crater names, centres and diameters drawn on the south pole map come straight from the IAU Gazetteer of Planetary Nomenclature (https://planetarynames.wr.usgs.gov), checked 2026-11-14 (comment in components/south-pole-map.tsx). The data side is gio's.

Q: - **Whole team:** complete the map imagery, icon, library and other resource inventory with exact links and applicable rights. No 3D Moon asset is assumed; the 3D feature is removed from scope.

Answer - trim/2026-11-14: App side, from package.json and the code:
- Map: no imagery. The south pole map is drawn in SVG by our code (latitude rings, crater circles from the Gazetteer, site pins).
- Icons: lucide-react (ISC licence, https://lucide.dev).
- Fonts, loaded from their CDN only: Excon from Fontshare (https://www.fontshare.com/fonts/excon) and JetBrains Mono from Google Fonts (https://fonts.google.com/specimen/JetBrains+Mono, OFL).
- Libraries: Next.js 16 (MIT), React 19 (MIT), Tailwind CSS 4 (MIT), shadcn/ui (MIT), Base UI (MIT), class-variance-authority (Apache-2.0), tw-animate-css (MIT). Dev: TypeScript (Apache-2.0), ESLint (MIT).
- App code licence: AGPL-3.0-only.

Licence names are from the packages' usual licences, not rechecked file by file: Not yet confirmed.

Q: - Existing font credits come from trim's recorded [A01](../sources.md#a01) and [A02](../sources.md#a02); confirm the final asset inventory and licences.

Answer - trim/2026-11-14: Still Excon and JetBrains Mono only, loaded from CDN links in app/layout.tsx. No font files in the repo.

### AI use - questions and final checks

Q: - **Trim/gio/whole team:** what exact tools and model names were used, for which tasks, and what human checking was actually completed?

Answer - trim/2026-11-14: trim used Claude Code (Anthropic) with Claude Opus models to write and edit the app code (app/, components/, lib/) and the repo setup. The exact model version per session was not recorded: Not yet confirmed. CI also runs Claude Code (`claude -p --model opus`) to review every PR after the deterministic check (.github/workflows/review.yml). Human checking: trim reviews and merges each change; every PR must pass `npm run check` (eslint, typecheck, and node --test unit tests, including known-answer tests). A full manual check of the live site: Not yet confirmed.

Q: - **Team:** what does the planned AI feature actually search or calculate, with which inputs, criteria and provider/model? Its presence in the final project must be reflected in the final tool inventory and disclosure.

Answer - trim/2026-11-14: Not yet confirmed. Nothing is built.

Q: - Complete any applicable visible acknowledgements and metadata for generated code/data. Inventory any generated images, video or audio and follow [N02 p. 8](../sources.md#n02).

Answer - trim/2026-11-14: App side: no generated images, video or audio. The app code was written with AI help (above). A visible acknowledgement in the app: Not yet confirmed.

### Public links - questions and final checks

Q: - What are the team's website and NASA project-page URLs?

Answer - trim/2026-11-14: Not yet confirmed.

Q: - Confirm the repository revision and the intended final entry point. A draft PR is not the project demo.

Answer - trim/2026-11-14: Repository: https://github.com/nitrimandylis/lunar-navigator. The entry point is the site's home page (app/page.tsx). Final revision: Not yet confirmed.
