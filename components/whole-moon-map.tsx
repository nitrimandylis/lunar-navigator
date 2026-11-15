import { EDGE_LAT } from "@/components/south-pole-map";
import type { SiteRow } from "@/lib/app-types";
import type { Ephemeris } from "@/lib/data";
import { dotLabel, lonLatToXY, nightPath, wrapLonDeg } from "@/lib/whole-moon";

export type WholeMoonMapProps = {
  // The sites to draw as dots: the reference landings and the custom points.
  rows: SiteRow[];
  selectedSiteId: string | null;
  // Where the Sun and Earth are overhead, hour by hour. null until it has
  // loaded: the map then shows no Sun, no Earth and no night.
  ephemeris: Ephemeris | null;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
  // Select a site. The selected hour stays as it is.
  onSelectSite: (siteId: string) => void;
  // The user clicked the strip that stands for the south pole sites.
  onShowSouthPole: () => void;
};

// The map is drawn 1 SVG unit per degree: 360 wide and 180 tall, with
// longitude -180 at x = 0 and latitude 90 at y = 0. The panel is about 350
// pixels wide, so one unit is about one screen pixel.
const MAP_WIDTH = 360;
const MAP_HEIGHT = 180;

// Room around the map, in SVG units: above it for the side names, below it
// for the longitude labels, and left and right for a dot right on the edge.
const TOP = 14;
const BOTTOM = 14;
const SIDE = 9;

// Grid lines every 30 degrees. Only a few of them get a number.
const GRID_LONGITUDES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const GRID_LATITUDES = [60, 30, 0, -30, -60];
const LABELLED_LONGITUDES = [-180, -90, 0, 90, 180];
const LABELLED_LATITUDES = [60, 0, -60];

// The Sun and Earth are drawn as markers of a fixed size, the same sizes as
// in the sky panorama.
const SUN_MARKER_RADIUS = 4;
const EARTH_MARKER_RADIUS = 5;

// A dot this close to the right edge gets its name on its left side.
const LABEL_FLIP_X = MAP_WIDTH - 70;

// Where a longitude and latitude go on this map.
function spotFor(lonDeg: number, latDeg: number): { x: number; y: number } {
  return lonLatToXY(wrapLonDeg(lonDeg), latDeg, MAP_WIDTH, MAP_HEIGHT);
}

// The whole Moon unrolled flat: the near side in the middle, the far side
// towards both edges. It shows the landings and custom points that the south
// pole map has no room for, where the Sun and Earth are overhead at the
// selected hour, and which half of the Moon is in the dark. Dots select a
// site. Nothing here picks a new point.
export function WholeMoonMap({
  rows,
  selectedSiteId,
  ephemeris,
  selectedHour,
  onSelectSite,
  onShowSouthPole,
}: WholeMoonMapProps) {
  // The Sun and Earth at the selected hour, once the ephemeris has loaded.
  let sunSpot: { x: number; y: number } | null = null;
  let earthSpot: { x: number; y: number } | null = null;
  let night: string | null = null;
  let skyText = "The Sun and Earth positions have not loaded.";
  if (ephemeris !== null) {
    const sunLon = wrapLonDeg(ephemeris.sub_solar_lon_deg[selectedHour]);
    const sunLat = ephemeris.sub_solar_lat_deg[selectedHour];
    const earthLon = wrapLonDeg(ephemeris.sub_earth_lon_deg[selectedHour]);
    const earthLat = ephemeris.sub_earth_lat_deg[selectedHour];

    sunSpot = spotFor(sunLon, sunLat);
    earthSpot = spotFor(earthLon, earthLat);
    night = nightPath(sunLat, sunLon, MAP_WIDTH, MAP_HEIGHT);
    skyText =
      "The Sun is overhead at latitude " +
      sunLat.toFixed(1) +
      ", longitude " +
      sunLon.toFixed(1) +
      ". Earth is overhead at latitude " +
      earthLat.toFixed(1) +
      ", longitude " +
      earthLon.toFixed(1) +
      ". The half of the Moon away from the Sun is shaded.";
  }

  // The Sun's name sits under it, pushed inward near the left and right edges
  // so it is not cut off.
  let sunLabelAnchor: "start" | "middle" | "end" = "middle";
  if (sunSpot !== null && sunSpot.x < 36) {
    sunLabelAnchor = "start";
  }
  if (sunSpot !== null && sunSpot.x > MAP_WIDTH - 36) {
    sunLabelAnchor = "end";
  }

  // Draw the selected dot last, so it sits on top of its neighbours.
  const dotRows: SiteRow[] = [];
  let selectedRow: SiteRow | null = null;
  for (const row of rows) {
    if (row.site.id === selectedSiteId) {
      selectedRow = row;
    } else {
      dotRows.push(row);
    }
  }
  if (selectedRow !== null) {
    dotRows.push(selectedRow);
  }

  // The strip along the bottom, from the edge of the south pole map down to
  // the pole. Every south pole site is somewhere inside it.
  const stripTop = lonLatToXY(0, EDGE_LAT, MAP_WIDTH, MAP_HEIGHT).y;
  const stripHeight = MAP_HEIGHT - stripTop;

  return (
    // The drawing shrinks if the panel is short, and the caption stays under it.
    <figure className="flex max-h-full flex-col gap-1.5">
      <svg
        viewBox={-SIDE + " " + -TOP + " " + (MAP_WIDTH + 2 * SIDE) + " " + (MAP_HEIGHT + TOP + BOTTOM)}
        className="h-auto min-h-0 w-full select-none"
        role="group"
        aria-label={"Map of the whole Moon. " + skyText}
      >
        {/* The Moon in daylight. Lines, labels and shading are decoration, so
            they are hidden from screen readers. */}
        <rect
          aria-hidden="true"
          x={0}
          y={0}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="fill-neither"
        />

        {/* Night: the half where the Sun is below a smooth horizon. */}
        {night !== null && (
          <path aria-hidden="true" d={night} className="pointer-events-none fill-background/90" />
        )}

        {/* Grid lines every 30 degrees. The two at -90 and 90 are stronger:
            they are the edge of the side that faces Earth. */}
        {GRID_LONGITUDES.map((lon) => {
          const x = spotFor(lon, 0).x;
          const isNearSideEdge = lon === -90 || lon === 90;
          return (
            <line
              aria-hidden="true"
              key={"lon-" + lon}
              x1={x}
              y1={0}
              x2={x}
              y2={MAP_HEIGHT}
              className={isNearSideEdge ? "stroke-muted-foreground/60" : "stroke-line"}
              strokeWidth={0.5}
            />
          );
        })}
        {GRID_LATITUDES.map((lat) => {
          const y = spotFor(0, lat).y;
          return (
            <line
              aria-hidden="true"
              key={"lat-" + lat}
              x1={0}
              y1={y}
              x2={MAP_WIDTH}
              y2={y}
              className="stroke-line"
              strokeWidth={0.5}
            />
          );
        })}
        <rect
          aria-hidden="true"
          x={0}
          y={0}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="fill-none stroke-line"
        />

        {/* Latitude numbers just inside the left edge. */}
        {LABELLED_LATITUDES.map((lat) => (
          <text
            aria-hidden="true"
            key={"lat-label-" + lat}
            x={3}
            y={spotFor(0, lat).y - 2}
            className="fill-muted-foreground/70 font-mono text-[9px] tabular-nums"
          >
            {lat + "°"}
          </text>
        ))}

        {/* Longitude numbers under the map. The two at the edges grow inward. */}
        {LABELLED_LONGITUDES.map((lon) => {
          let anchor: "start" | "middle" | "end" = "middle";
          if (lon === -180) {
            anchor = "start";
          }
          if (lon === 180) {
            anchor = "end";
          }
          return (
            <text
              aria-hidden="true"
              key={"lon-label-" + lon}
              x={lonLatToXY(lon, 0, MAP_WIDTH, MAP_HEIGHT).x}
              y={MAP_HEIGHT + 10}
              textAnchor={anchor}
              className="fill-muted-foreground/70 font-mono text-[9px] tabular-nums"
            >
              {lon + "°"}
            </text>
          );
        })}

        {/* Which side is which, above the map. */}
        <text x={45} y={-4} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          Far side
        </text>
        <text x={180} y={-4} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          Near side
        </text>
        <text x={315} y={-4} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          Far side
        </text>

        {/* The south pole sites. Clicking the strip goes back to their map. */}
        <g
          role="button"
          tabIndex={0}
          aria-label="South pole sites. Show the south pole map"
          className="group cursor-pointer outline-none [&:focus-visible_text]:underline"
          onClick={onShowSouthPole}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onShowSouthPole();
            }
          }}
        >
          <title>Every south pole site is inside this strip. Click for the south pole map.</title>
          {/* A taller invisible box, so the thin strip is still easy to click. */}
          <rect
            x={0}
            y={stripTop - 12}
            width={MAP_WIDTH}
            height={stripHeight + 12}
            className="fill-transparent"
          />
          <rect
            x={0}
            y={stripTop}
            width={MAP_WIDTH}
            height={stripHeight}
            className="fill-bright/30 group-hover:fill-bright/50"
          />
          <text x={120} y={stripTop - 3} textAnchor="middle" className="fill-bright text-[10px]">
            South pole sites
          </text>
        </g>

        {/* The Sun and Earth, each at the place where it is straight overhead.
            They never catch the pointer, so a dot under one can still be clicked.
            Earth stays near the middle of the map and the Sun passes it once a
            month, so Earth's name goes above it and the Sun's name below: the
            two names never cross. Earth's name ends at Earth, which keeps it
            clear of the landings just to the east. */}
        {earthSpot !== null && (
          <g className="pointer-events-none">
            <circle cx={earthSpot.x} cy={earthSpot.y} r={EARTH_MARKER_RADIUS} className="fill-comms" />
            <text
              x={earthSpot.x + EARTH_MARKER_RADIUS}
              y={earthSpot.y - EARTH_MARKER_RADIUS - 3}
              textAnchor="end"
              className="fill-bright text-[10px]"
            >
              Earth overhead
            </text>
          </g>
        )}
        {sunSpot !== null && (
          <g className="pointer-events-none">
            <circle cx={sunSpot.x} cy={sunSpot.y} r={SUN_MARKER_RADIUS} className="fill-power" />
            <text
              x={sunSpot.x}
              y={sunSpot.y + SUN_MARKER_RADIUS + 11}
              textAnchor={sunLabelAnchor}
              className="fill-bright text-[10px]"
            >
              Sun overhead
            </text>
          </g>
        )}

        {/* Site dots, with the same look as the pins on the south pole map:
            a landing is a filled dot in a ring, a custom point is hollow, and
            the selected one is bright with a bigger ring. */}
        {dotRows.map((row) => {
          const site = row.site;
          const isSelected = site.id === selectedSiteId;
          const spot = spotFor(site.lon, site.lat);

          let dotRadius = 3.5;
          if (isSelected) {
            dotRadius = 4.5;
          }

          let dotClass = "fill-foreground stroke-background";
          if (row.isCustom) {
            dotClass = "fill-panel stroke-muted-foreground";
          }
          if (isSelected && row.isCustom) {
            dotClass = "fill-panel stroke-bright";
          }
          if (isSelected && !row.isCustom) {
            dotClass = "fill-bright";
          }

          // The name sits right of the dot, or left of it near the right edge,
          // a little further out when the dot has its bigger selection ring.
          let labelGap = 9;
          if (isSelected) {
            labelGap = 12;
          }
          let labelX = spot.x + labelGap;
          let labelAnchor: "start" | "end" = "start";
          if (spot.x > LABEL_FLIP_X) {
            labelX = spot.x - labelGap;
            labelAnchor = "end";
          }

          // A custom point is named by its numbers, which use the mono font.
          let labelFont = "text-[10px]";
          if (row.isCustom) {
            labelFont = "font-mono text-[9px] tabular-nums";
          }
          let labelColour = "fill-foreground";
          if (isSelected) {
            labelColour = "fill-bright font-medium";
          }

          function selectThisSite() {
            onSelectSite(site.id);
          }

          return (
            <g
              key={"dot-" + site.id}
              role="button"
              tabIndex={0}
              aria-label={site.name}
              aria-pressed={isSelected}
              className="group cursor-pointer outline-none"
              onClick={selectThisSite}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectThisSite();
                }
              }}
            >
              <title>{site.name}</title>
              {/* A bigger invisible circle, so a small dot is still easy to click. */}
              <circle cx={spot.x} cy={spot.y} r={7} className="fill-transparent" />
              {/* Keyboard focus ring. */}
              <circle
                cx={spot.x}
                cy={spot.y}
                r={10}
                className="hidden fill-none stroke-bright group-focus-visible:block"
                strokeWidth={0.75}
                strokeDasharray="2 2"
              />
              {row.isReference && !isSelected && (
                <circle cx={spot.x} cy={spot.y} r={6} className="fill-none stroke-bright" strokeWidth={1.25} />
              )}
              {isSelected && (
                <circle cx={spot.x} cy={spot.y} r={8.5} className="fill-none stroke-bright" strokeWidth={1.5} />
              )}
              <circle cx={spot.x} cy={spot.y} r={dotRadius} className={dotClass} strokeWidth={1.25} />
              {/* The name is part of the button: clicking it selects the site too. */}
              <text
                x={labelX}
                y={spot.y + 3.5}
                textAnchor={labelAnchor}
                className={labelColour + " " + labelFont}
              >
                {dotLabel(site.name, row.isCustom)}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="shrink-0 text-xs text-muted-foreground">
        Dots are past landings and custom points: click one to select it. Every south pole
        site is inside the strip along the bottom: click the strip for their map.
      </figcaption>
    </figure>
  );
}
