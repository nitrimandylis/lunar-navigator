import type { Hourly, SiteRow } from "@/lib/app-types";
import { yTicks } from "@/lib/clearance";
import {
  bodyTrack,
  compassWord,
  skyLinePath,
  skyYRange,
  terrainPoints,
} from "@/lib/sky";
import { DAYS_IN_MONTH, HOURS_PER_DAY, firstDayOfMonth } from "@/lib/time";

export type SkyPanoramaProps = {
  // The selected site, or null when nothing is selected.
  row: SiteRow | null;
  // The selected site's hourly data, or null while it is still loading.
  hourly: Hourly | null;
  // The month whose Sun and Earth paths are drawn. 0 = January.
  visibleMonth: number;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
};

// Size of the drawing in SVG units. The SVG stretches to the panel width and
// keeps this shape, so one unit is about one screen pixel.
const WIDTH = 620;
const HEIGHT = 116;
const LEFT = 44;
const RIGHT = 8;
const TOP = 6;
const BOTTOM = 16;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

// The Sun and Earth are drawn as markers of a fixed size. At this scale their
// real discs would be 1 or 2 pixels across.
const SUN_MARKER_RADIUS = 4;
const EARTH_MARKER_RADIUS = 5;

type CompassLabel = {
  azDeg: number;
  word: string;
  // Which side of the letter sits on the tick. The letters at the two edges
  // grow inward so they are not cut off.
  anchor: "start" | "middle" | "end";
};

// The compass points along the bottom: north at both ends.
const COMPASS_LABELS: CompassLabel[] = [
  { azDeg: 0, word: "N", anchor: "start" },
  { azDeg: 90, word: "E", anchor: "middle" },
  { azDeg: 180, word: "S", anchor: "middle" },
  { azDeg: 270, word: "W", anchor: "middle" },
  { azDeg: 360, word: "N", anchor: "end" },
];

// Turns an azimuth into an x position inside the plot: north at the left edge,
// then east, south and west, and north again at the right edge.
function xFor(azDeg: number): number {
  return (azDeg / 360) * PLOT_WIDTH;
}

// The Sun or Earth at the selected hour: a filled marker when it is in view,
// a hollow dashed one when the terrain hides it, with its name above.
function BodyMarker({
  name,
  x,
  y,
  radius,
  isVisible,
  fillClass,
  strokeClass,
}: {
  name: string;
  x: number;
  y: number;
  radius: number;
  isVisible: boolean;
  fillClass: string;
  strokeClass: string;
}) {
  // Keep the name inside the plot when the marker is near an edge.
  const labelX = Math.min(Math.max(x, 14), PLOT_WIDTH - 14);
  // The name sits above the marker, or below it when there is no room above.
  let labelY = y - radius - 3;
  if (labelY < TOP + 9) {
    labelY = y + radius + 11;
  }

  return (
    <g>
      {isVisible && <circle cx={x} cy={y} r={radius} className={fillClass} />}
      {!isVisible && (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="2 2"
          className={strokeClass}
        />
      )}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        className="fill-bright text-[11px]"
      >
        {name}
      </text>
    </g>
  );
}

// The sky around the selected site at the selected hour: the terrain horizon
// all the way round, with the Sun and Earth at their real direction and
// height. The faint lines are the paths they take during the month on screen.
export function SkyPanorama({ row, hourly, visibleMonth, selectedHour }: SkyPanoramaProps) {
  // The clearance charts below already say "loading" or "select a site".
  if (row === null || hourly === null) {
    return null;
  }

  // A reference or custom site has no terrain: its horizon is flat, 0 degrees
  // all the way round. One value with a step of 360 degrees says exactly that.
  let terrainElevDeg = [0];
  let terrainStepDeg = 360;
  if ("horizon" in hourly) {
    terrainElevDeg = hourly.horizon.elev_deg;
    terrainStepDeg = hourly.horizon.az_step_deg;
  }

  const range = skyYRange(terrainElevDeg, hourly.sun_elev_deg, hourly.earth_elev_deg);
  const ticks = yTicks(range);

  // Turns an elevation into a y position: range.max at the top.
  function yFor(elevDeg: number): number {
    const fraction = (range.max - elevDeg) / (range.max - range.min);
    return TOP + fraction * PLOT_HEIGHT;
  }

  const bottomY = TOP + PLOT_HEIGHT;

  // The terrain line, and the same line closed along the bottom: the ground.
  const terrainLine = skyLinePath(
    terrainPoints(terrainElevDeg, terrainStepDeg),
    xFor,
    yFor,
  );
  const ground = terrainLine + " L" + PLOT_WIDTH + "," + bottomY + " L0," + bottomY + " Z";

  // The paths of the Sun and Earth during the month on screen.
  const startHour = firstDayOfMonth(visibleMonth) * HOURS_PER_DAY;
  const endHour = startHour + DAYS_IN_MONTH[visibleMonth] * HOURS_PER_DAY;
  const sunPieces = bodyTrack(hourly.sun_az_deg, hourly.sun_elev_deg, startHour, endHour);
  const earthPieces = bodyTrack(hourly.earth_az_deg, hourly.earth_elev_deg, startHour, endHour);

  const sunAz = hourly.sun_az_deg[selectedHour];
  const sunElev = hourly.sun_elev_deg[selectedHour];
  const earthAz = hourly.earth_az_deg[selectedHour];
  const earthElev = hourly.earth_elev_deg[selectedHour];
  const sunIsVisible = hourly.sun_visible[selectedHour] === 1;
  const earthIsVisible = hourly.earth_visible[selectedHour] === 1;

  const description =
    "Sun at azimuth " +
    sunAz.toFixed(0) +
    " degrees, elevation " +
    sunElev.toFixed(1) +
    " degrees, " +
    (sunIsVisible ? "in view" : "below the horizon") +
    ". Earth at azimuth " +
    earthAz.toFixed(0) +
    " degrees, elevation " +
    earthElev.toFixed(1) +
    " degrees, " +
    (earthIsVisible ? "in view" : "below the horizon") +
    ".";

  return (
    <figure>
      <figcaption className="flex items-baseline justify-between gap-4 text-sm text-foreground">
        <span>Sky all the way round, height stretched</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          Sun {sunAz.toFixed(0)}° {compassWord(sunAz)} · Earth {earthAz.toFixed(0)}°{" "}
          {compassWord(earthAz)}
        </span>
      </figcaption>
      <svg
        viewBox={"0 0 " + WIDTH + " " + HEIGHT}
        className="h-auto w-full"
        role="img"
        aria-label={"Terrain horizon around the site with the Sun and Earth. " + description}
      >
        {/* Y labels and faint grid lines. */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="stroke-line/50"
            />
            <text
              x={LEFT - 6}
              y={yFor(tick) + 4}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[11px] tabular-nums"
            >
              {tick + "°"}
            </text>
          </g>
        ))}

        <g transform={"translate(" + LEFT + ", 0)"}>
          <defs>
            <clipPath id="sky-plot">
              <rect x={0} y={TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
            </clipPath>
          </defs>

          <g clipPath="url(#sky-plot)">
            {/* The month's paths go under the ground, so the part of a path
                that is behind the terrain looks dimmer. */}
            {sunPieces.map((piece, index) => (
              <path
                key={"sun-" + index}
                d={skyLinePath(piece, xFor, yFor)}
                fill="none"
                strokeWidth={1}
                className="stroke-power/60"
              />
            ))}
            {earthPieces.map((piece, index) => (
              <path
                key={"earth-" + index}
                d={skyLinePath(piece, xFor, yFor)}
                fill="none"
                strokeWidth={1}
                className="stroke-comms/70"
              />
            ))}

            {/* The ground: everything below the terrain horizon. */}
            <path d={ground} className="fill-neither/70" />
            <path d={terrainLine} fill="none" strokeWidth={1.25} className="stroke-foreground" />
          </g>

          {/* Compass ticks and letters along the bottom. */}
          {COMPASS_LABELS.map((label) => (
            <g key={label.azDeg}>
              <line
                x1={xFor(label.azDeg)}
                x2={xFor(label.azDeg)}
                y1={bottomY}
                y2={bottomY + 4}
                className="stroke-line"
              />
              <text
                x={xFor(label.azDeg)}
                y={HEIGHT - 2}
                textAnchor={label.anchor}
                className="fill-muted-foreground font-mono text-[11px]"
              >
                {label.word}
              </text>
            </g>
          ))}

          <BodyMarker
            name="Earth"
            x={xFor(earthAz)}
            y={yFor(earthElev)}
            radius={EARTH_MARKER_RADIUS}
            isVisible={earthIsVisible}
            fillClass="fill-comms"
            strokeClass="stroke-comms"
          />
          <BodyMarker
            name="Sun"
            x={xFor(sunAz)}
            y={yFor(sunElev)}
            radius={SUN_MARKER_RADIUS}
            isVisible={sunIsVisible}
            fillClass="fill-power"
            strokeClass="stroke-power"
          />
        </g>
      </svg>
    </figure>
  );
}
