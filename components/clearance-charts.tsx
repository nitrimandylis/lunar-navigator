import type { Hourly, SiteRow } from "@/lib/app-types";
import {
  chartYRange,
  clearanceSeries,
  linePath,
  yTicks,
  type Body,
} from "@/lib/clearance";
import { DAYS_IN_MONTH, HOURS_PER_DAY, firstDayOfMonth } from "@/lib/time";

export type ClearanceChartsProps = {
  // The selected site, or null when nothing is selected.
  row: SiteRow | null;
  // The selected site's hourly data, or null while it is still loading.
  hourly: Hourly | null;
  // True when the selected site's hourly file failed to load.
  hourlyFailed: boolean;
  // The month to show. 0 = January.
  visibleMonth: number;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
};

// Size of the drawing in SVG units. The SVG stretches to the panel width and
// keeps this shape, so one unit is about one screen pixel.
// About the drawn width in pixels, so 11 units of text come out near 11 px.
// The two charts sit side by side, so each is half the column wide.
const WIDTH = 300;
const HEIGHT = 80;
const LEFT = 44;
const RIGHT = 8;
const TOP = 6;
const BOTTOM = 18;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

// One chart: the clearance of the Sun or Earth for every hour of the month.
function ClearanceChart({
  title,
  body,
  hourly,
  visibleMonth,
  selectedHour,
}: {
  title: string;
  body: Body;
  hourly: Hourly;
  visibleMonth: number;
  selectedHour: number;
}) {
  const dayCount = DAYS_IN_MONTH[visibleMonth];
  const startHour = firstDayOfMonth(visibleMonth) * HOURS_PER_DAY;
  const endHour = startHour + dayCount * HOURS_PER_DAY;

  const values = clearanceSeries(hourly, body, startHour, endHour);
  const range = chartYRange(values);
  const ticks = yTicks(range);
  const xStep = PLOT_WIDTH / values.length;

  // Turns degrees into a y position: range.max at the top, range.min at the bottom.
  function yFor(value: number): number {
    const fraction = (range.max - value) / (range.max - range.min);
    return TOP + fraction * PLOT_HEIGHT;
  }

  const zeroY = yFor(0);
  const line = linePath(values, xStep, yFor);
  const lastX = (values.length - 1) * xStep;
  // The line, then down to the ridge and back along it: the area between them.
  const area = line + " L" + lastX + "," + zeroY + " L0," + zeroY + " Z";

  // Sun parts use the orange "power" colour, Earth parts the blue "comms" one.
  let fillClass = "fill-power/20";
  let strokeClass = "stroke-power";
  if (body === "earth") {
    fillClass = "fill-comms/20";
    strokeClass = "stroke-comms";
  }

  // Clip shapes that keep only the part above, or below, the ridge.
  const aboveId = "clearance-above-" + body;
  const belowId = "clearance-below-" + body;

  const selectedIsInMonth = selectedHour >= startHour && selectedHour < endHour;
  const selectedX = (selectedHour - startHour) * xStep;

  // Day ticks along the bottom, with a number on every fifth day: 1, 6, 11.
  const dayTicks = [];
  for (let day = 0; day < dayCount; day++) {
    const x = day * HOURS_PER_DAY * xStep;
    dayTicks.push(
      <g key={day}>
        <line
          x1={x}
          x2={x}
          y1={TOP + PLOT_HEIGHT}
          y2={TOP + PLOT_HEIGHT + 4}
          className="stroke-line"
        />
        {day % 5 === 0 && (
          <text
            x={x + 2}
            y={HEIGHT - 4}
            className="fill-muted-foreground font-mono text-[11px] tabular-nums"
          >
            {day + 1}
          </text>
        )}
      </g>,
    );
  }

  return (
    <figure>
      <figcaption className="text-sm text-foreground">{title}</figcaption>
      <svg
        viewBox={"0 0 " + WIDTH + " " + HEIGHT}
        className="h-auto w-full"
        role="img"
        aria-label={title + " clearance above the terrain horizon, in degrees, for each hour of the month"}
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
            <clipPath id={aboveId}>
              <rect x={0} y={0} width={PLOT_WIDTH} height={zeroY} />
            </clipPath>
            <clipPath id={belowId}>
              <rect x={0} y={zeroY} width={PLOT_WIDTH} height={HEIGHT - zeroY} />
            </clipPath>
          </defs>

          {/* Above the ridge: soft body colour. Below it: a muted tone. */}
          <path d={area} className={fillClass} clipPath={"url(#" + aboveId + ")"} />
          <path
            d={area}
            className="fill-muted-foreground/10"
            clipPath={"url(#" + belowId + ")"}
          />

          {/* The ridge: clearance 0, where the body appears or disappears. */}
          <line x1={0} x2={PLOT_WIDTH} y1={zeroY} y2={zeroY} className="stroke-foreground" />

          {/* The clearance line, coloured above the ridge and muted below it. */}
          <path
            d={line}
            fill="none"
            strokeWidth={1.5}
            className={strokeClass}
            clipPath={"url(#" + aboveId + ")"}
          />
          <path
            d={line}
            fill="none"
            strokeWidth={1.5}
            className="stroke-muted-foreground"
            clipPath={"url(#" + belowId + ")"}
          />

          {dayTicks}

          {selectedIsInMonth && (
            <line
              x1={selectedX}
              x2={selectedX}
              y1={TOP}
              y2={TOP + PLOT_HEIGHT}
              strokeWidth={2}
              className="stroke-bright"
            />
          )}
        </g>
      </svg>
    </figure>
  );
}

// The Sun and Earth clearance charts for the selected site and month.
export function ClearanceCharts({
  row,
  hourly,
  hourlyFailed,
  visibleMonth,
  selectedHour,
}: ClearanceChartsProps) {
  if (row === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a site to see how far the Sun and Earth sit above its horizon.
      </p>
    );
  }
  if (hourly === null && hourlyFailed) {
    return (
      <p role="alert" className="text-sm text-bright">
        Could not load this site&apos;s hourly data. Select the site again to retry.
      </p>
    );
  }
  if (hourly === null) {
    return <p className="text-sm text-muted-foreground">Loading hourly data.</p>;
  }

  return (
    // Side by side from lg. Below lg one chart per row, so each is twice as big.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ClearanceChart
        title="Sun"
        body="sun"
        hourly={hourly}
        visibleMonth={visibleMonth}
        selectedHour={selectedHour}
      />
      <ClearanceChart
        title="Earth"
        body="earth"
        hourly={hourly}
        visibleMonth={visibleMonth}
        selectedHour={selectedHour}
      />
    </div>
  );
}
