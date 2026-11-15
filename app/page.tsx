// The homepage. It says what the tool is, sends each kind of visitor to the
// part made for them, and explains where the numbers come from. It is drawn
// on the server. Its motion is CSS (app/home-motion.css, the hm- classes),
// plus one small script for the parts that follow the pointer and the scroll
// (components/home-motion.tsx).

import { CalendarRange, GraduationCap, Telescope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BuddyFigure } from "@/components/buddy";
import { HomeMotion } from "@/components/home-motion";
import { CRATERS } from "@/lib/craters";
import type { DaySummary, Site } from "@/lib/data";
import { laneOpacity, shortSiteName } from "@/lib/grid";
import { craterLabelSpot, kmToMapPx, projectForMap } from "@/lib/map";
import { GLASER_CHECKS, SOURCE_LINKS } from "@/lib/method";
import { MONTH_NAMES } from "@/lib/time";
import sitesJson from "@/public/data/sites.json";
import ribbonJson from "@/public/data/summary/shackleton-ridge.json";

import "./home-motion.css";

const SITES: Site[] = sitesJson;

// The year ribbon under the hero shows one real site: every day of 2027 at
// the lit ridge near Shackleton, from the same file the tool reads.
const RIBBON_SITE_ID = "shackleton-ridge";
const RIBBON_DAYS: DaySummary[] = ribbonJson.days;
const HOURS_PER_DAY = 24;

// The latitude rings drawn on the relief.
const RING_LATS = [-85, -88];
// The rings are labelled along this longitude, where no site sits. The map in
// the tool uses the same one.
const RING_LABEL_LON = 160;

// The relief picture is round, with the pole in the middle, longitude 0 at
// the top and latitude -82 at its edge. These are the same numbers the map in
// the tool draws with, so a dot here sits where its pin sits there.
const RELIEF_RADIUS = 152;
const RELIEF_EDGE_LAT = -82;
const RELIEF_VIEW_BOX =
  -RELIEF_RADIUS + " " + -RELIEF_RADIUS + " " + 2 * RELIEF_RADIUS + " " + 2 * RELIEF_RADIUS;

// The three kinds of visitor, and the part of the tool each one starts in.
const DOORS = [
  {
    audience: "Mission planners",
    text:
      "Set how long you stay and how much Sun and Earth you need. Every site is " +
      "checked hour by hour, 2027 to 2040, and ranked by the days you could land.",
    linkText: "Open the planner",
    href: "/app?plan=lander",
    Icon: CalendarRange,
  },
  {
    audience: "Educators",
    text:
      "Five steps about two places 2.1 km apart with opposite lighting. " +
      "Ends at Apollo 11 for contrast.",
    linkText: "Start the tour",
    href: "/app?tour=1",
    Icon: GraduationCap,
  },
  {
    audience: "Everyone else",
    text:
      "Pick a place and press play. The Sun skims the horizon and Earth hangs " +
      "in one spot.",
    linkText: "Explore a site",
    href: "/app?site=shackleton-ridge",
    Icon: Telescope,
  },
];

// How a number in the tool is made, in order.
const STEPS = [
  "NASA's JPL Horizons gives the direction of the Sun and Earth from each site, " +
    "for every hour from 2027 to 2040.",
  "LOLA, the laser altimeter on NASA's Lunar Reconnaissance Orbiter, gives the " +
    "ground. From each site we look out to 150 km in 360 directions and keep the " +
    "highest ground in each one, seen from 2 m up.",
  "The Sun or Earth counts as in view when any part of its disc is above that " +
    "ground. There is no air to bend the light, so the answer is a plain yes or no.",
];

const TEXT_LINK =
  "text-bright underline decoration-muted-foreground underline-offset-4 hover:decoration-bright";

// The headline, shown one word at a time when the page opens.
const HEADLINE = "Where to land at the Moon's south pole, and when.";

// A CSS variable for one element: its place in a staggered animation.
function stagger(name: "--i" | "--d", index: number): CSSProperties {
  return { [name]: index } as CSSProperties;
}

export default function Home() {
  // The ribbon: the site's name, the year, and its hours of Sun and of Earth
  // in view, added up over the days.
  let ribbonSiteName = "";
  for (const site of SITES) {
    if (site.id === RIBBON_SITE_ID) {
      ribbonSiteName = shortSiteName(site.name);
    }
  }
  const ribbonYear = RIBBON_DAYS[0].date.slice(0, 4);
  let ribbonSunHours = 0;
  let ribbonEarthHours = 0;
  // How many days each month has, in order, so the month names can sit under
  // their own days.
  const daysInMonth: number[] = [];
  for (const day of RIBBON_DAYS) {
    ribbonSunHours = ribbonSunHours + day.sun_hours;
    ribbonEarthHours = ribbonEarthHours + day.earth_hours;
    // "2027-03-14" is in month 3, which is index 2.
    const monthIndex = Number(day.date.slice(5, 7)) - 1;
    if (daysInMonth.length <= monthIndex) {
      daysInMonth.push(0);
    }
    daysInMonth[monthIndex] = daysInMonth[monthIndex] + 1;
  }
  const ribbonTotalHours = RIBBON_DAYS.length * HOURS_PER_DAY;

  return (
    <div className="hm-root flex flex-col">
      <HomeMotion
        year={Number(ribbonYear)}
        sunHours={RIBBON_DAYS.map((day) => day.sun_hours)}
        earthHours={RIBBON_DAYS.map((day) => day.earth_hours)}
      />
      <header className="hm-header flex items-center gap-6 border-b border-line px-4 py-3 lg:px-8">
        <p className="font-medium text-bright">MoonFromEarth</p>
        {/* Hidden on a phone, where the same button sits just below. */}
        <nav className="ml-auto flex items-center gap-5 text-sm max-sm:hidden">
          <a href="#how" className="hover:text-bright">
            How it works
          </a>
          <a href="#sources" className="hover:text-bright">
            Sources
          </a>
          <Link href="/app" className={TEXT_LINK}>
            Open the navigator
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero. From lg up the relief hangs off the right edge, cut by the
            section. Below lg it sits under the text, with its lower part cut. */}
        <section className="hm-hero relative overflow-hidden border-b border-line lg:flex lg:min-h-[44rem] lg:items-center">
          <canvas aria-hidden="true" className="hm-stars" />
          <div className="relative z-10 px-4 pt-12 pb-10 lg:w-[42vw] lg:max-w-[36rem] lg:px-8 lg:py-20">
            <h1 className="text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[1.04] font-medium tracking-tight text-bright">
              {HEADLINE.split(" ").map((word, index) => (
                <span key={index}>
                  <span className="hm-word">
                    <span style={stagger("--i", index)}>{word}</span>
                  </span>{" "}
                </span>
              ))}
            </h1>
            <p className="hm-rise-1 mt-6 max-w-[34rem] text-lg leading-relaxed">
              Compare landing sites by{" "}
              <span className="text-power">hours of sunlight for power</span> and{" "}
              <span className="text-comms">hours of Earth in view for radio</span>. Every
              hour from 2027 to 2040, with real terrain.
            </p>
            <div className="hm-rise-2 mt-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="hm-sheen flex h-11 items-center rounded-md bg-bright px-5 font-medium text-background transition-[filter,transform] duration-150 ease-out hover:brightness-90 active:scale-[0.97] motion-reduce:transition-none"
              >
                Open the navigator
              </Link>
              <Link
                href="/app?tour=1"
                className="flex h-11 items-center rounded-md border border-line px-5 font-medium text-bright transition-[background-color,transform] duration-150 ease-out hover:bg-neither active:scale-[0.97] motion-reduce:transition-none"
              >
                Take the tour
              </Link>
              {/* The guide from the tour, standing by a line that starts it. */}
              <Link
                href="/app?tour=1"
                className="group flex basis-full items-center gap-3 pt-3 text-sm"
              >
                <span aria-hidden="true" className="block w-11 shrink-0">
                  <BuddyFigure looksUp={false} isGreeting={false} />
                </span>
                <span className="underline decoration-muted-foreground underline-offset-4 group-hover:decoration-bright">
                  New here? Selini, our guide, walks you through it in five steps.
                </span>
              </Link>
            </div>
          </div>

          <figure>
            {/* Below lg this box cuts off the lower part of the relief. */}
            <div className="max-lg:h-[82vw] max-lg:overflow-hidden">
              <div className="relative aspect-square max-lg:mx-[-8%] lg:absolute lg:top-1/2 lg:right-[-6vw] lg:w-[min(60vw,54rem)] lg:-translate-y-1/2">
                {/* hm-tilt leans with the pointer; hm-settle plays once on load. */}
                <div className="hm-tilt absolute inset-0">
                <div className="hm-settle absolute inset-0">
                  <Image
                    src="/data/basemap.png"
                    alt="Shaded relief of the Moon's south pole, with craters, seen from above."
                    fill
                    sizes="(min-width: 1024px) 60vw, 116vw"
                    loading="eager"
                    className="opacity-70"
                  />
                  <div aria-hidden="true" className="hm-light">
                    <i />
                  </div>
                  <svg viewBox={RELIEF_VIEW_BOX} className="hm-map absolute inset-0 size-full">
                    <circle
                      aria-hidden="true"
                      cx={0}
                      cy={0}
                      r={RELIEF_RADIUS - 0.25}
                      className="fill-none stroke-line"
                      strokeWidth={0.5}
                    />

                    {/* Latitude rings and crater names, as on the map in the
                        tool. The text is too small to read below lg. */}
                    <g aria-hidden="true">
                      {RING_LATS.map((lat) => {
                        const ringRadius = projectForMap(lat, 180, RELIEF_RADIUS, RELIEF_EDGE_LAT).y;
                        const labelSpot = projectForMap(
                          lat,
                          RING_LABEL_LON,
                          RELIEF_RADIUS,
                          RELIEF_EDGE_LAT,
                        );
                        return (
                          <g key={lat}>
                            <circle
                              cx={0}
                              cy={0}
                              r={ringRadius}
                              className="hm-ring fill-none stroke-bright/45"
                              strokeWidth={0.4}
                              strokeDasharray="1.5 1.5"
                            />
                            <text
                              x={labelSpot.x + 1.5}
                              y={labelSpot.y + 1.5}
                              fontSize={3.4}
                              paintOrder="stroke"
                              strokeWidth={1.2}
                              className="fill-foreground stroke-background font-mono max-lg:hidden"
                            >
                              {-lat + "° S"}
                            </text>
                          </g>
                        );
                      })}
                      {CRATERS.map((crater) => {
                        const centre = projectForMap(
                          crater.lat,
                          crater.lon,
                          RELIEF_RADIUS,
                          RELIEF_EDGE_LAT,
                        );
                        const craterRadius = kmToMapPx(
                          crater.diameterKm / 2,
                          RELIEF_RADIUS,
                          RELIEF_EDGE_LAT,
                        );
                        const label = craterLabelSpot(centre, craterRadius, crater.labelSide, 1.5, 4);
                        return (
                          <text
                            key={crater.name}
                            x={label.x}
                            y={label.y}
                            fontSize={4}
                            textAnchor={label.anchor}
                            paintOrder="stroke"
                            strokeWidth={1.4}
                            className="fill-bright stroke-background italic max-lg:hidden"
                          >
                            {crater.name}
                          </text>
                        );
                      })}
                    </g>

                    {SITES.map((site, siteIndex) => {
                      const spot = projectForMap(site.lat, site.lon, RELIEF_RADIUS, RELIEF_EDGE_LAT);
                      const isMission = site.mission !== undefined;
                      return (
                        <Link
                          key={site.id}
                          href={"/app?site=" + site.id}
                          aria-label={"Open " + site.name}
                          data-name={site.name}
                          style={stagger("--i", siteIndex)}
                          className="hm-site group outline-none"
                        >
                          <title>{site.name}</title>
                          {/* A bigger, unseen circle so the dot is easy to hit. */}
                          <circle cx={spot.x} cy={spot.y} r={5} className="fill-transparent" />
                          {/* Keyboard focus ring. */}
                          <circle
                            cx={spot.x}
                            cy={spot.y}
                            r={6}
                            className="hidden fill-none stroke-bright group-focus-visible:block"
                            strokeWidth={0.6}
                            strokeDasharray="1.5 1.5"
                          />
                          {/* Real mission targets are ringed, as on the map in the tool. */}
                          {isMission && <circle cx={spot.x} cy={spot.y} r={1.7} className="hm-pulse" />}
                          {isMission && (
                            <circle
                              cx={spot.x}
                              cy={spot.y}
                              r={3.6}
                              className="fill-none stroke-bright"
                              strokeWidth={0.6}
                            />
                          )}
                          <circle
                            cx={spot.x}
                            cy={spot.y}
                            r={1.7}
                            className="hm-dot fill-power stroke-background group-hover:fill-bright"
                            strokeWidth={0.4}
                          />
                        </Link>
                      );
                    })}
                  </svg>
                  <div aria-hidden="true" className="hm-sun">
                    <i />
                  </div>
                </div>
                </div>
              </div>
            </div>
            <figcaption className="hm-caption z-10 px-4 py-3 text-xs text-muted-foreground lg:absolute lg:bottom-5 lg:left-8 lg:max-w-[34rem] lg:p-0">
              LOLA terrain out to 82° S, seen from above with Earth towards the top. It
              is lit by a made-up light, not the real Sun. Each dot is a site in the
              tool. Ringed dots are real mission targets. The circling Sun is an
              illustration of how it skims the horizon, not a real position.
            </figcaption>
          </figure>
        </section>

        {/* A year of real data for one site, drawn the way the tool draws a
            day: an orange lane for the Sun and a blue lane for Earth. */}
        <section className="hm-strip flex flex-col gap-3 border-b border-line bg-panel/50 px-4 py-6 lg:px-8">
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-1 text-sm">
            <p className="text-bright">
              {ribbonSiteName}, every day of {ribbonYear}
            </p>
            <p className="lg:ml-auto">
              <span className="hm-count text-power" data-count={Math.round(ribbonSunHours)}>
                {Math.round(ribbonSunHours).toLocaleString("en-US")}
              </span>{" "}
              hours of Sun and{" "}
              <span className="hm-count text-comms" data-count={Math.round(ribbonEarthHours)}>
                {Math.round(ribbonEarthHours).toLocaleString("en-US")}
              </span>{" "}
              with Earth in view, out of {ribbonTotalHours.toLocaleString("en-US")}
            </p>
          </div>
          {/* hm-chart holds the marker that follows the pointer. */}
          <div className="hm-chart">
          <svg
            role="img"
            aria-label={
              "Hours of Sun and hours with Earth in view at " +
              ribbonSiteName +
              ", for each day of " +
              ribbonYear +
              "."
            }
            viewBox={"0 0 " + RIBBON_DAYS.length + " 21"}
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
            className="h-12 w-full"
          >
            {/* The two empty lanes, then one mark per day with any hours.
                Stronger colour means more hours, as in the tool. */}
            <rect x={0} y={0} width={RIBBON_DAYS.length} height={10} className="fill-neither" />
            <rect x={0} y={11} width={RIBBON_DAYS.length} height={10} className="fill-neither" />
            {RIBBON_DAYS.map((day, index) => {
              const power = laneOpacity(day.sun_hours, HOURS_PER_DAY);
              const comms = laneOpacity(day.earth_hours, HOURS_PER_DAY);
              return (
                <g key={day.date}>
                  {power > 0 && (
                    <rect x={index} y={0} width={1} height={10} className="fill-power" opacity={power} />
                  )}
                  {comms > 0 && (
                    <rect x={index} y={11} width={1} height={10} className="fill-comms" opacity={comms} />
                  )}
                </g>
              );
            })}
          </svg>
          <i aria-hidden="true" className="hm-scrub" />
          </div>
          {/* Each month name is as wide as its days. */}
          <div aria-hidden="true" className="hm-months flex text-xs text-muted-foreground">
            {daysInMonth.map((days, monthIndex) => (
              <span
                key={monthIndex}
                style={{ flexGrow: days, ...stagger("--d", monthIndex) }}
                className="basis-0 border-l border-line pl-1 max-sm:overflow-hidden"
              >
                {MONTH_NAMES[monthIndex]}
              </span>
            ))}
          </div>
        </section>

        {/* One door per kind of visitor. The whole door is the link. */}
        <section className="grid divide-y divide-line border-b border-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {DOORS.map((door, doorIndex) => (
            <Link
              key={door.audience}
              href={door.href}
              data-reveal
              style={stagger("--d", doorIndex)}
              className="hm-card group flex flex-col gap-3 px-4 py-8 transition-colors duration-150 ease-out hover:bg-panel motion-reduce:transition-none lg:px-8 lg:py-10"
            >
              <door.Icon aria-hidden="true" strokeWidth={1.5} className="size-6 text-power" />
              <h2 className="text-xl font-medium text-bright">{door.audience}</h2>
              <p className="max-w-[34rem] leading-relaxed">{door.text}</p>
              <span className="hm-arrow mt-auto self-start pt-2 text-bright underline decoration-muted-foreground underline-offset-4 group-hover:decoration-power">
                {door.linkText}
              </span>
            </Link>
          ))}
        </section>

        <section
          id="how"
          className="grid gap-x-12 gap-y-6 border-b border-line px-4 py-12 lg:grid-cols-[14rem_minmax(0,44rem)] lg:px-8 lg:py-16"
        >
          <h2 data-reveal className="text-2xl font-medium text-bright">
            How it works
          </h2>
          <div className="flex flex-col gap-8 leading-relaxed">
            {/* The steps are a sequence, so a line joins each number to the next. */}
            <ol className="flex flex-col">
              {STEPS.map((step, index) => (
                <li key={step} data-reveal className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="hm-num flex size-8 shrink-0 items-center justify-center rounded-sm border border-line bg-panel font-mono text-sm text-bright">
                      {index + 1}
                    </span>
                    {index < STEPS.length - 1 && <span className="hm-rail w-px flex-1 bg-line" />}
                  </div>
                  <p className="pt-1 pb-6">{step}</p>
                </li>
              ))}
            </ol>

            <p data-reveal>
              The Moon is tilted by only about 1.5 degrees, so near the south pole the Sun
              circles the horizon all month, a degree or two up. A hill a few kilometres
              away is enough to block it, which is why two places 2 km apart can have
              almost constant sunlight and none at all. Earth barely moves in the lunar
              sky: a wobble of a few degrees lifts it above the polar horizon for about
              half of each month and drops it below for the rest.
            </p>

            <p data-reveal className="text-muted-foreground">
              This is geometry only, not a power, temperature or radio budget. Sites
              marked computed are points our own terrain scan found, not official
              landing sites.
            </p>

            <div data-reveal>
              <details className="border-t border-line py-4">
                <summary className="cursor-pointer text-bright">
                  Checked against published numbers
                </summary>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <p>
                    Sunlit share of the year at five points, ours against Glaser et al.
                    2014. Their spot coordinates come from their EPSC abstract.
                  </p>
                  <div className="overflow-x-auto rounded-md border border-line">
                    <table className="w-full text-left tabular-nums">
                      <thead className="whitespace-nowrap text-muted-foreground">
                        <tr className="border-b border-line">
                          <th className="px-3 py-1.5 font-normal">Point</th>
                          <th className="px-3 py-1.5 font-normal">Height</th>
                          <th className="px-3 py-1.5 text-right font-normal">Ours %</th>
                          <th className="px-3 py-1.5 text-right font-normal">Glaser %</th>
                          <th className="px-3 py-1.5 text-right font-normal">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GLASER_CHECKS.map((row) => (
                          <tr key={row.point} className="border-b border-line last:border-b-0">
                            <td className="px-3 py-1.5">{row.point}</td>
                            <td className="px-3 py-1.5 whitespace-nowrap">{row.height}</td>
                            <td className="px-3 py-1.5 text-right">{row.ours}</td>
                            <td className="px-3 py-1.5 text-right">{row.glaser}</td>
                            <td className="px-3 py-1.5 text-right">{row.difference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    At 10 m we agree within half a point. At 2 m two spots read 6 to 8
                    points lower. Results at 2 m depend on exactly which 5 to 20 m pixel a
                    point falls on, and Glaser simulate 19 years against our one. Malapert
                    is not checked, because we found no open published value for it.
                  </p>
                </div>
              </details>

              <details className="border-y border-line py-4">
                <summary className="cursor-pointer text-bright">
                  What the numbers on a site card mean
                </summary>
                <dl className="mt-4 flex flex-col gap-3 text-sm">
                  <div>
                    <dt className="text-bright">Sun at 10 m</dt>
                    <dd>
                      The same sums with the solar panel 10 m up instead of 2 m. Near the
                      pole a few metres of height can clear a ridge, so the card shows both.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-bright">Slope</dt>
                    <dd>
                      The tilt of the ground, from the 30 m LOLA terrain. It is the
                      average over a 30 m square, so boulders and small craters under a
                      lander do not show.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-bright">Permanent shadow</dt>
                    <dd>
                      The distance to the edge of the nearest region that never sees the
                      Sun, where water ice may survive. Only regions of 1 square kilometre
                      or more are counted, from NASA&apos;s LOLA map of them. Smaller
                      shadows can be much closer.
                    </dd>
                  </div>
                </dl>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="sources"
        className="grid gap-x-12 gap-y-6 px-4 py-12 lg:grid-cols-[14rem_minmax(0,44rem)] lg:px-8 lg:py-16"
      >
        <h2 data-reveal className="text-2xl font-medium text-bright">
          Sources
        </h2>
        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <ul className="flex flex-col gap-2">
            {SOURCE_LINKS.map((link, linkIndex) => (
              <li key={link.href} data-reveal style={stagger("--d", linkIndex)}>
                <a href={link.href} target="_blank" rel="noreferrer" className={TEXT_LINK}>
                  {link.label}
                </a>
                <span className="text-muted-foreground">: {link.note}</span>
              </li>
            ))}
          </ul>
          <p data-reveal className="text-muted-foreground">
            Built for the NASA Space Apps Challenge 2026, Athens. The{" "}
            <a href="/deck.pdf" className={TEXT_LINK}>
              slide deck
            </a>{" "}
            is a PDF. The code is open under the AGPL-3.0 licence.
          </p>
          <p data-reveal className="text-muted-foreground">
            We built this with AI coding tools: Claude Code wrote most of the code and tests
            from our instructions. The numbers come from NASA data and plain arithmetic, not
            from an AI model.
          </p>
        </div>
      </footer>
    </div>
  );
}
