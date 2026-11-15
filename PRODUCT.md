# MoonFromEarth

## What it is

A web tool for mission planners (and readable by educators and the public) to compare
south pole landing sites and dates: hours of Sun (power) and Earth (comms) at each site,
with terrain horizons, from JPL Horizons ephemerides and LOLA terrain.

## Where it is headed

Hackathon build, 14-15 Nov 2026. South pole only, calendar years 2027 to 2040, hourly, UTC.

Built now:

- Homepage at `/`: one sentence on what the tool is, the LOLA relief of the south pole with
  a dot per site (each dot opens that site), crater names and latitude rings, a ribbon of
  one real site's Sun and Earth hours for every day of 2027, one door per kind of visitor (mission planners
  to the planner, educators to the tour, everyone else to a site), How it works in three
  steps with the published check and the site card numbers folded away, and the sources.
  It is drawn on the server, with one load-in when it opens. The tool itself lives at
  `/app`. A link made before the move (`/?site=`, `/?time=`, `/?plan=`) is sent on to `/app`
  with the same query, and `/app?tour=1` starts the guided tour.
- Sites grid: one row per site, two lanes per day (orange power, blue comms), one month at
  a time. Click a day to open its 24 hours; Escape or the close button shuts it.
- Year picker and month chips in the header: a drop-down list of the years with data (2027
  to 2040 now, one line per year in `YEARS` in `lib/time.ts`) and the 12 months of the year
  on screen, tinted by the selected site's monthly hours. The 14 years are one
  timeline of 5114 days, so Play, the slider and the arrow keys run straight from one year
  into the next. Each year's files are loaded and joined in the browser. In the data files a
  dark spell is cut at the first and last hour of each year, so the selected site's day
  totals are worked out again from its joined hours and a spell that crosses New Year is
  whole in the verdict line. A spell is still cut at the start of 2027 and the end of 2040.
- Site facts on the selected site's card, from optional fields in `sites.json`: the Sun
  share of 2027 to 2030 from a 10 m mast next to the 2 m figure for the same years (`sun_pct_10m`), the ground
  slope of the 30 m LOLA cell (`slope_deg`) and the distance to the nearest permanent
  shadow (`psr_km`). The homepage says what each one means.
- Sort by power (Sun hours), comms (Earth hours) or both at once, for the month on screen.
  Rows glide to their new place when the sort or the month changes, and the day cells fade
  to the new month. All motion is off when the system asks for reduced motion.
- Real mission targets (IM-2, Artemis III candidate regions) next to computed candidates,
  marked with a mission tag.
- Sky panorama: the terrain horizon all the way round the selected site (north, east,
  south, west, north), with the Sun and Earth at their real direction and height for the
  selected hour, and the paths they take during the month. A body hidden by terrain is
  drawn hollow.
- Time controls: a play button runs time forward (about a lunar day per minute), a slider
  scrubs through the month, and the left and right arrow keys step one hour. The grid, the
  panorama, the charts and the countdowns all follow the same hour.
- Clearance charts: how far the Sun and Earth sit above the terrain horizon, every hour of
  the month, with the selected hour marked.
- Selected-site numbers beside the charts: Sun and Earth height above the terrain (raw
  elevation underneath), and countdowns to sunset or sunrise and to
  Earthset or Earthrise.
- Verdict line: the Selected site panel says the month in words, for example "In May the
  Sun is up 47% of the time and Earth is in view 100%. Power is the limit here, not the
  radio link. Longest dark spell: 13 d 17 h." Past landings and custom points now carry the
  whole dark spell that touches a day, as the data files do.
- South pole map out to -82, with ten crater outlines, site pins (mission targets ringed)
  and two near pairs (near Shackleton, 2.1 km apart, and near Sverdrup, 2.5 km apart, each a
  lit and a shadowed site). Click empty ground to pick a custom point. Under it sits a
  shaded relief picture made from the LOLA terrain (lit by a made-up light, not the real
  Sun), with a sharper one inside -87.5 once zoomed in.
- Past landings for comparison: Apollo 11, Blue Ghost 1 (CLPS), SLIM, Chandrayaan-3 and
  Chang'e 6 (far side), with coordinates from the NASA NSSDCA table. They are worked out in
  the browser on a smooth Moon with no terrain, listed under their own divider, and never
  ranked against the polar sites.
- Custom points: up to 3, anywhere on the Moon by typing (map clicks stay inside the polar
  map), with a flat horizon and no terrain. On a laptop or bigger the form sits beside the
  big map, opened with "Zoom in or add a point" under the small map; on a phone it has its
  own panel on the Map tab. They are listed apart from the curated sites,
  under their own divider, and never ranked against them, because a flat horizon near the
  pole gives far too many Sun hours.

- Plain-language layer: every panel has a one-sentence caption, and an About panel explains
  how to read the screen and what the tool does not tell you. Why the pole is not like
  Earth, where the numbers come from and the sources are on the homepage, which About
  links to.

- Share link and CSV: under the selected site, "Copy link" copies a link that opens the
  page on the same site and hour (`/app?site=<id>&time=2027-05-16T07:00Z`), and "Download CSV"
  saves the site's 122,736 hourly rows, 2027 to 2040 (Sun and Earth elevation, azimuth and
  visibility).
  Custom points have no link, because they only exist in the browser tab.

- Tour guide: Selini, a small astronaut (`components/buddy.tsx`), stands by the tour card. From a
  laptop screen up the card floats next to what each step talks about, and the guide greets
  the visitor at the start and says goodbye on Finish. The same drawing stands under the
  two buttons on the homepage, by a line that starts the tour, and is on slides 1 and 7 of
  the deck and at the top of the README (`docs/selini.svg`).

- Loading screen: shown until the site data is in.

- Homepage motion: on load, on scroll and under the pointer. Off with reduced motion.

- Guided tour: five steps from a header button, telling one story (two places 2.1 km apart
  with opposite lighting, then the date change, then Apollo 11 for contrast). Each step
  selects the site and month it talks about. A test recomputes every number in the tour
  text from the data files. The part of the page a step points at stays lit and the rest
  dims to 30% and cannot be clicked, fading between steps. Right and Left arrows move
  between steps, Escape closes, and on a phone each step opens the tab its target is on.

- Mission planner: a header button opens a panel that answers "where and when can this
  mission land?" for every site at once. Three starting missions (short lander 14 days,
  crewed stay 7 days, long rover 100 days with at most 50 h of dark, as planned for VIPER),
  each with editable needs: length of stay, share of the stay with the Sun and with Earth
  in view, longest dark spell. Every site is checked hour by hour from 2027 to 2040 and
  ranked by the number of days with a landing time that works, with a 14-year strip per site
  and its next landing time. Clicking a site or a day shows it on the main page. Past
  landings and custom points are listed apart, not ranked.

- Phone and tablet layout: below 1024 px a tab bar at the bottom shows one panel at a
  time: Sites, Selected site (opens first) or Map (with the custom point form). The header
  is two lines: the title with Tour and About, then the months in one row that scrolls
  sideways. Sort and Plan a mission sit at the top of the Sites tab. Each site is two lines,
  name and totals, then all the days of the month, so nothing scrolls sideways. Picking a
  site in the grid or on the map opens the Selected site tab, which runs: name and verdict,
  play and slider (sticky), a taller sky panorama drawn for the phone, the two numbers,
  then the Sun and Earth charts one per row. Buttons are 40 px tall. The desktop layout is
  unchanged.

Still open:

- Terrain for custom points. Judged not possible before the deadline.
