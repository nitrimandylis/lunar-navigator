// The homepage. It says what the tool is, sends each kind of visitor to the
// part made for them, and explains where the numbers come from. It is drawn
// on the server and ships no JavaScript of its own.

import Image from "next/image";
import Link from "next/link";

import type { Site } from "@/lib/data";
import { projectForMap } from "@/lib/map";
import { GLASER_CHECKS, SOURCE_LINKS } from "@/lib/method";
import sitesJson from "@/public/data/sites.json";

const SITES: Site[] = sitesJson;

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
  },
  {
    audience: "Educators",
    text:
      "Five steps about two places 2.1 km apart with opposite lighting. " +
      "Ends at Apollo 11 for contrast.",
    linkText: "Start the tour",
    href: "/app?tour=1",
  },
  {
    audience: "Everyone else",
    text:
      "Pick a place and press play. The Sun skims the horizon and Earth hangs " +
      "in one spot.",
    linkText: "Explore a site",
    href: "/app?site=shackleton-ridge",
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

// One load-in when the page opens: the text rises, then the relief settles.
// Both start fast and slow down, and both are off when the system asks for
// reduced motion.
const LOAD_IN_EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const RISE =
  "animate-in fade-in slide-in-from-bottom-3 duration-600 fill-mode-both motion-reduce:animate-none " +
  LOAD_IN_EASE;
const SETTLE =
  "animate-in fade-in zoom-in-[0.97] duration-900 delay-100 fill-mode-both motion-reduce:animate-none " +
  LOAD_IN_EASE;

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-6 border-b border-line px-4 py-3 lg:px-8">
        <p className="font-medium text-bright">Lunar Landing Site Navigator</p>
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
        <section className="relative overflow-hidden border-b border-line lg:flex lg:min-h-[44rem] lg:items-center">
          <div className={"relative z-10 px-4 pt-12 pb-10 lg:w-[42vw] lg:max-w-[36rem] lg:px-8 lg:py-20 " + RISE}>
            <h1 className="text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[1.04] font-medium tracking-tight text-bright">
              Where to land at the Moon&apos;s south pole, and when.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed">
              Compare landing sites by hours of sunlight for power and hours of Earth in
              view for radio. Every hour from 2027 to 2040, with real terrain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="flex h-11 items-center rounded-md bg-bright px-5 font-medium text-background transition-[filter,transform] duration-150 ease-out hover:brightness-90 active:scale-[0.97] motion-reduce:transition-none"
              >
                Open the navigator
              </Link>
              <Link
                href="/app?tour=1"
                className="flex h-11 items-center rounded-md border border-line px-5 font-medium text-bright transition-[background-color,transform] duration-150 ease-out hover:bg-neither active:scale-[0.97] motion-reduce:transition-none"
              >
                Take the tour
              </Link>
            </div>
          </div>

          <figure>
            {/* Below lg this box cuts off the lower part of the relief. */}
            <div className="max-lg:h-[82vw] max-lg:overflow-hidden">
              <div className="relative aspect-square max-lg:mx-[-8%] lg:absolute lg:top-1/2 lg:right-[-6vw] lg:w-[min(60vw,54rem)] lg:-translate-y-1/2">
                <div className={"absolute inset-0 " + SETTLE}>
                  <Image
                    src="/data/basemap.png"
                    alt="Shaded relief of the Moon's south pole, with craters, seen from above."
                    fill
                    sizes="(min-width: 1024px) 60vw, 116vw"
                    loading="eager"
                    className="opacity-70"
                  />
                  <svg viewBox={RELIEF_VIEW_BOX} className="absolute inset-0 size-full">
                    <circle
                      aria-hidden="true"
                      cx={0}
                      cy={0}
                      r={RELIEF_RADIUS - 0.25}
                      className="fill-none stroke-line"
                      strokeWidth={0.5}
                    />
                    {SITES.map((site) => {
                      const spot = projectForMap(site.lat, site.lon, RELIEF_RADIUS, RELIEF_EDGE_LAT);
                      const isMission = site.mission !== undefined;
                      return (
                        <Link
                          key={site.id}
                          href={"/app?site=" + site.id}
                          aria-label={"Open " + site.name}
                          className="group outline-none"
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
                            className="fill-power stroke-background group-hover:fill-bright"
                            strokeWidth={0.4}
                          />
                        </Link>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
            <figcaption className="z-10 px-4 py-3 text-xs text-muted-foreground lg:absolute lg:bottom-5 lg:left-8 lg:max-w-[34rem] lg:p-0">
              LOLA terrain out to 82° S, lit by a made-up light, not the real Sun. Each
              dot is a site in the tool. Ringed dots are real mission targets.
            </figcaption>
          </figure>
        </section>

        {/* One door per kind of visitor. */}
        <section className="grid divide-y divide-line border-b border-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {DOORS.map((door) => (
            <div key={door.audience} className="flex flex-col gap-3 px-4 py-8 lg:px-8 lg:py-10">
              <h2 className="text-xl font-medium text-bright">{door.audience}</h2>
              <p className="max-w-[34rem] leading-relaxed">{door.text}</p>
              <Link href={door.href} className={"mt-auto self-start pt-2 " + TEXT_LINK}>
                {door.linkText}
              </Link>
            </div>
          ))}
        </section>

        <section
          id="how"
          className="grid gap-x-12 gap-y-6 border-b border-line px-4 py-12 lg:grid-cols-[14rem_minmax(0,44rem)] lg:px-8 lg:py-16"
        >
          <h2 className="text-2xl font-medium text-bright">How it works</h2>
          <div className="flex flex-col gap-8 leading-relaxed">
            <ol className="flex flex-col gap-4">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-5">
                  <span className="font-mono text-bright">{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>

            <p>
              The Moon is tilted by only about 1.5 degrees, so near the south pole the Sun
              circles the horizon all month, a degree or two up. A hill a few kilometres
              away is enough to block it, which is why two places 2 km apart can have
              almost constant sunlight and none at all. Earth barely moves in the lunar
              sky: a wobble of a few degrees lifts it above the polar horizon for about
              half of each month and drops it below for the rest.
            </p>

            <p className="text-muted-foreground">
              This is geometry only, not a power, temperature or radio budget. Sites
              marked computed are points our own terrain scan found, not official
              landing sites.
            </p>

            <div>
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
        <h2 className="text-2xl font-medium text-bright">Sources</h2>
        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <ul className="flex flex-col gap-2">
            {SOURCE_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer" className={TEXT_LINK}>
                  {link.label}
                </a>
                <span className="text-muted-foreground">: {link.note}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Built for the NASA Space Apps Challenge 2026, Athens. The{" "}
            <a href="/deck.pdf" className={TEXT_LINK}>
              slide deck
            </a>{" "}
            is a PDF. The code is open under the AGPL-3.0 licence.
          </p>
        </div>
      </footer>
    </div>
  );
}
