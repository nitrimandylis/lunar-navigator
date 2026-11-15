"use client";

import { useEffect, useRef } from "react";

export type AboutOverlayProps = {
  onClose: () => void;
};

// The outside pages the method section links to.
const SOURCE_LINKS = [
  {
    href: "https://ssd.jpl.nasa.gov/horizons/",
    label: "NASA/JPL Horizons",
    note: "where the Sun and Earth are, hour by hour",
  },
  {
    href: "https://trek.nasa.gov/moon/",
    label: "LRO LOLA terrain, from NASA Moon Trek",
    note: "the shape of the ground at the south pole",
  },
  {
    href: "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html",
    label: "NASA NSSDCA table of spacecraft on the Moon",
    note: "coordinates of the past landings",
  },
  {
    href: "https://lroc.im-ldi.com/images/1401",
    label: "LROC page for the IM-2 landing site",
    note: "the IM-2 coordinates",
  },
  {
    href: "https://elib.dlr.de/94242",
    label: "Glaser et al. 2014, Icarus 243",
    note: "the published sunlight figure we compare with",
  },
  {
    href: "https://github.com/nitrimandylis/lunar-navigator",
    label: "Source code and data",
    note: "everything behind this page",
  },
];

// One titled part of the About text.
function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-bright">{title}</h3>
      {children}
    </section>
  );
}

// A full-screen panel that explains the page to someone new: how to read it,
// why the Moon is not like Earth, and where the numbers come from.
export function AboutOverlay({ onClose }: AboutOverlayProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // The latest onClose, so the Escape listener below is set up only once.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes the panel. Focus starts on the close button.
  useEffect(() => {
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="About this page"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-lg border border-line bg-panel">
        <header className="flex items-center gap-4 border-b border-line px-5 py-3">
          <h2 className="font-medium text-bright">About this page</h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto rounded-md bg-neither px-2.5 py-1 text-bright"
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-foreground">
          <Part title="What it is for">
            <p>
              A lander on the Moon needs two things from the sky. It needs the Sun, for
              power and warmth. It needs a clear line to Earth, to talk by radio without
              a relay satellite. This page shows when each place gets both, so that
              places and dates can be compared quickly.
            </p>
          </Part>

          <Part title="How to read the screen">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                <span className="text-bright">Sites.</span> Each row is a place, each
                column a day of the month. The top half of a square is{" "}
                <span className="text-power">orange</span> when the Sun is up that day,
                the bottom half is <span className="text-comms">blue</span> when Earth is
                in view. A stronger colour means more hours. Click a square to open that
                day hour by hour.
              </li>
              <li>
                <span className="text-bright">Years and months.</span> The list and the
                buttons at the top change the year and the month. A later launch date means a different month, and often a
                different answer.
              </li>
              <li>
                <span className="text-bright">Sky all the way round.</span> Stand at the
                selected place and turn once: north, east, south, west, north. The line is
                the ground against the sky. A filled dot is in view. A hollow dot is hidden
                behind the ground.
              </li>
              <li>
                <span className="text-bright">Play.</span> Runs time forward so you can
                watch the Sun and Earth move. The numbers on the left count down to the
                next sunset and the next time Earth sets.
              </li>
              <li>
                <span className="text-bright">Plan a mission.</span> Pick a kind of
                mission and how much Sun and Earth it needs. Every site is then checked
                hour by hour for all four years, and ranked by how many days have a
                landing time that works. Click a site or a day to see it on the main page.
              </li>
              <li>
                <span className="text-bright">Map.</span> The south pole seen from above.
                Click it to zoom in and pick your own place. The grey relief shows the
                shape of the ground. It is lit from one side by a made-up light, so its
                shadows are not real sunlight.
              </li>
            </ul>
          </Part>

          <Part title="Why the Moon is not like Earth">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                <span className="text-bright">A day lasts a month.</span> From one sunrise
                to the next takes about 29.5 Earth days. At the Apollo 11 site that means
                about two weeks of daylight, then two weeks of night.
              </li>
              <li>
                <span className="text-bright">At the pole the Sun never climbs.</span> The
                Moon is tilted by only about 1.5 degrees, so near the south pole the Sun
                circles the horizon all month, a degree or two up. A hill a few kilometres
                away is enough to block it. That is why two places 2 km apart can have
                almost constant sunlight and none at all.
              </li>
              <li>
                <span className="text-bright">Earth hangs in one spot.</span> The Moon
                always shows Earth the same face, so Earth does not cross the sky. It only
                wobbles by a few degrees. At the pole that small wobble lifts Earth above
                the horizon for about half of each month and drops it below for the rest.
              </li>
              <li>
                <span className="text-bright">There is no air.</span> No twilight, no
                bending of light near the horizon, no glow in a shadow. The Sun is either
                in view or it is not.
              </li>
            </ul>
          </Part>

          <Part title="Where the numbers come from">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                Sun and Earth positions come from NASA/JPL Horizons, for every hour from
                2027 to 2030, as seen from each site.
              </li>
              <li>
                The ground comes from the LOLA laser altimeter on NASA&apos;s Lunar
                Reconnaissance Orbiter. For each site we look out to 150 km in 360
                directions and keep the highest ground in each one, seen from 2 m above
                the surface.
              </li>
              <li>
                The Sun and Earth are discs, not points. A body counts as in view when any
                part of its disc is above the ground.
              </li>
              <li>
                As a check, our best-lit point on the Connecting Ridge is sunlit for 91.3
                percent of 2027. A published study (Glaser et al. 2014) reports about 92
                percent for the same ridge over 19 years. The two agree in size. It is a
                plausibility check, not a replication.
              </li>
            </ul>
          </Part>

          <Part title="What it does not tell you">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                It is geometry only: when the Sun and Earth are above the ground. It is not
                a power budget, a temperature model or a radio link budget.
              </li>
              <li>It covers 2027 to 2030, one sample per hour, in UTC.</li>
              <li>
                Past landings and custom points use a smooth Moon with no terrain, so they
                are shown apart and never ranked against the south pole sites.
              </li>
              <li>
                Sites marked computed are points our own terrain scan found. They are not
                official landing sites.
              </li>
            </ul>
          </Part>

          <Part title="Sources">
            <ul className="flex flex-col gap-1">
              {SOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-bright underline underline-offset-2"
                  >
                    {link.label}
                  </a>
                  <span className="text-muted-foreground">: {link.note}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              Built for the NASA Space Apps Challenge 2026, Lunar Landing Site Navigator.
            </p>
          </Part>
        </div>
      </div>
    </div>
  );
}
