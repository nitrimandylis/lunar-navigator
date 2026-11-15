"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type AboutOverlayProps = {
  onClose: () => void;
};

// One titled part of the About text.
function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-bright">{title}</h3>
      {children}
    </section>
  );
}

// A full-screen panel with what someone needs while using the tool: how to
// read the screen and what it does not tell you. The method and the sources
// are on the homepage.
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
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/85 p-4 backdrop-blur-sm duration-200 fade-in motion-reduce:animate-none"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl animate-in duration-200 fade-in slide-in-from-bottom-2 motion-reduce:animate-none flex-col rounded-lg border border-line bg-panel">
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
          <Part title="How to read the screen">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                In Sites, each row is a place and each column a day. The top half of a
                square is <span className="text-power">orange</span> when the Sun is up
                that day, the bottom half <span className="text-comms">blue</span> when
                Earth is in view. A stronger colour means more hours. Click a square to
                open that day hour by hour.
              </li>
              <li>
                The year list and the month buttons at the top change the date. A later
                launch means a different month, and often a different answer.
              </li>
              <li>
                The sky panel is the view from the selected place, turning once from
                north round to north. The line is the ground. A filled dot is in view,
                a hollow dot is behind the ground.
              </li>
              <li>
                Play runs time forward. The countdowns show the time to the next sunset
                and the next time Earth sets.
              </li>
              <li>
                Plan a mission checks every site hour by hour against the Sun and Earth
                a mission needs, and ranks the sites by the days with a landing time
                that works.
              </li>
              <li>
                On the map, click to zoom in and pick your own place. The grey relief is
                lit by a made-up light, so its shadows are not real sunlight.
              </li>
            </ul>
          </Part>

          <Part title="What it does not tell you">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                It is geometry only: when the Sun and Earth are above the ground. It is
                not a power, temperature or radio budget.
              </li>
              <li>It covers 2027 to 2040, one sample per hour, in UTC.</li>
              <li>
                Past landings and custom points use a smooth Moon with no terrain, so
                they are listed apart and never ranked against the south pole sites.
              </li>
              <li>
                Sites marked computed are points our own terrain scan found, not
                official landing sites.
              </li>
            </ul>
          </Part>

          <p>
            How the numbers are made, the check against published figures and the
            sources are on{" "}
            <Link
              href="/#how"
              className="text-bright underline decoration-muted-foreground underline-offset-4 hover:decoration-bright"
            >
              the homepage
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
