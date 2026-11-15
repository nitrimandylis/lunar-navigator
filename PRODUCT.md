# lunar-navigator

## What it is

A web tool for mission planners (and readable by educators and the public) to compare
south pole landing sites and dates: hours of Sun (power) and Earth (comms) at each site,
with terrain horizons, from JPL Horizons ephemerides and LOLA terrain.

## Where it is headed

Hackathon build, 14-15 Nov 2026. South pole only, calendar years 2027 to 2030, hourly, UTC.

Built now:

- Sites grid: one row per site, two lanes per day (orange power, blue comms), one month at
  a time. Click a day to open its 24 hours; Escape or the close button shuts it.
- Year picker and month chips in the header: a drop-down list of the years with data (2027
  to 2030 now, one line per year in `YEARS` in `lib/time.ts`) and the 12 months of the year
  on screen, tinted by the selected site's monthly hours. The four years are one
  timeline of 1461 days, so Play, the slider and the arrow keys run straight from one year
  into the next. Each year's files are loaded and joined in the browser. In the data files a
  dark spell is cut at the first and last hour of each year, so the verdict line can
  understate a spell that crosses New Year.
- Sort by power (Sun hours), comms (Earth hours) or both at once, for the month on screen.
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
  map), with a flat horizon and no terrain. They are listed apart from the curated sites,
  under their own divider, and never ranked against them, because a flat horizon near the
  pole gives far too many Sun hours.

- Plain-language layer: every panel has a one-sentence caption, and an About panel explains
  how to read the screen, why the Moon is not like Earth, where the numbers come from, what
  the tool does not tell you, and links the sources.

- Share link and CSV: under the selected site, "Copy link" copies a link that opens the
  page on the same site and hour (`?site=<id>&time=2027-05-16T07:00Z`), and "Download CSV"
  saves the site's 35,064 hourly rows, 2027 to 2030 (Sun and Earth elevation, azimuth and
  visibility).
  Custom points have no link, because they only exist in the browser tab.

- Guided tour: five steps from a header button, telling one story (two places 2.1 km apart
  with opposite lighting, then the date change, then Apollo 11 for contrast). Each step
  selects the site and month it talks about. A test recomputes every number in the tour
  text from the data files. The part of the page a step points at stays lit and the rest
  dims to 30% and cannot be clicked, fading between steps. Right and Left arrows move
  between steps, Escape closes, and on a phone each step scrolls its target into view.

- Mission planner: a header button opens a panel that answers "where and when can this
  mission land?" for every site at once. Three starting missions (short lander 14 days,
  crewed stay 7 days, long rover 100 days with at most 50 h of dark, as planned for VIPER),
  each with editable needs: length of stay, share of the stay with the Sun and with Earth
  in view, longest dark spell. Every site is checked hour by hour from 2027 to 2030 and
  ranked by the number of days with a landing time that works, with a four-year strip per site
  and its next landing time. Clicking a site or a day shows it on the main page. Past
  landings and custom points are listed apart, not ranked.

- Phone and tablet layout: below 1024 px the page scrolls and the panels stack (Sites,
  Selected site, South pole map, Custom point). The Sites grid scrolls sideways inside its
  panel, the header wraps, and the header and play buttons are 40 px tall. The desktop
  layout is unchanged.

Still open:

- Terrain for custom points. Judged not possible before the deadline.
