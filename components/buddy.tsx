// Selini, the tour's guide: a small astronaut, drawn as one SVG. The tour card moves it
// around (components/tour-card.tsx) and the homepage shows it standing still.
// Its motion is the buddy- classes in app/globals.css.

import { cn } from "@/lib/utils";

// The drawing itself. While it greets, the arm waves fast.
export function BuddyFigure({
  looksUp,
  isGreeting,
  lookX = 0,
  isStill = false,
  hasFlame = false,
  isFlameOut = false,
}: {
  looksUp: boolean;
  isGreeting: boolean;
  // Where the eyes look sideways: -1 left, 0 ahead, 1 right.
  lookX?: number;
  // True in the close-up, where the gentle bob would be a big jump.
  isStill?: boolean;
  // True while it flies: a small jet burns under it.
  hasFlame?: boolean;
  // True near the end of the flight: the jet fades before it lands.
  isFlameOut?: boolean;
}) {
  const eyeY = isStill ? 0 : looksUp ? -2.5 : 2;
  return (
        <svg viewBox="0 0 64 74" className={cn("block w-full overflow-visible", !isStill && "buddy-bob")}>
          {hasFlame && (
            <g
              className="transition-opacity duration-500 motion-reduce:transition-none"
              style={{ opacity: isFlameOut ? 0 : 1 }}
            >
              <g className="buddy-flame">
                <path d="M25.5 66q6.5 17 13 0z" className="fill-power" />
                <path d="M29 66q3 9 6 0z" className="fill-bright" />
              </g>
            </g>
          )}
          <ellipse cx="32" cy="71" rx="15" ry="2.5" className="fill-background/70" />
          {/* Antenna with a light. */}
          <path d="M32 11V4" className="stroke-bright" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="3.5" r="3" className="buddy-light fill-power" />
          {/* Waving arm, then the resting one. */}
          <path
            d="M44 51q9-3 10-13"
            className={cn("fill-none stroke-bright", isGreeting ? "buddy-arm-hi" : "buddy-arm")}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M20 51q-7 2-8 9" className="fill-none stroke-bright" strokeWidth="3" strokeLinecap="round" />
          {/* Feet and body. */}
          <rect x="21.5" y="63" width="8" height="6" rx="2.5" className="fill-bright" />
          <rect x="34.5" y="63" width="8" height="6" rx="2.5" className="fill-bright" />
          <rect x="20" y="45" width="24" height="20" rx="8" className="fill-panel stroke-bright" strokeWidth="2" />
          <circle cx="32" cy="55" r="2.5" className="buddy-light fill-comms" />
          {/* Helmet and visor. */}
          <circle cx="32" cy="29" r="18" className="fill-panel stroke-bright" strokeWidth="2" />
          <rect x="18.5" y="20" width="27" height="17" rx="8.5" className="fill-background stroke-line" />
          <g
            className="transition-transform duration-500 ease-in-out motion-reduce:transition-none"
            style={{ transform: `translate(${lookX * 2.2}px, ${eyeY}px)` }}
          >
            <ellipse cx="26.5" cy="28" rx="2.3" ry="3" className="buddy-eye fill-bright" />
            <ellipse cx="37.5" cy="28" rx="2.3" ry="3" className="buddy-eye fill-bright" />
          </g>
          <path d="M29 33.5q3 2 6 0" className="fill-none stroke-bright" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
  );
}
