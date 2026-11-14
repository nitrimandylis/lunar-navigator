import { NEAR_PAIRS, type PickedPoint, type SiteRow } from "@/lib/app-types";
import { distanceKm, projectSouthPole } from "@/lib/geometry";
import { clampLabelX, kmToMapPx, unprojectSouthPole } from "@/lib/map";

export type SouthPoleMapProps = {
  // Every site to pin, curated and custom.
  rows: SiteRow[];
  selectedSiteId: string | null;
  // The point the user clicked on the map and has not added yet, marked with a
  // cross. null if none. The navigator clears it once the point is added.
  pickedPoint: PickedPoint | null;
  // Select a site. The selected hour stays as it is.
  onSelectSite: (siteId: string) => void;
  // The user clicked empty ground: offer this point to the custom point form.
  onPickPoint: (lat: number, lon: number) => void;
};

// The SVG is drawn in a 340 by 340 box with the pole at (0, 0).
const VIEW_SIZE = 340;
// Map radius in SVG units: the edge circle, latitude -80.
const MAP_RADIUS = 148;
const EDGE_LAT = -80;

const LATITUDE_RINGS = [-88, -86, -84, -82];
const SPOKE_LONGITUDES = [0, 90, 180, 270];

// Craters near the curated sites, for context.
// Names, centres and diameters from the IAU Gazetteer of Planetary
// Nomenclature (https://planetarynames.wr.usgs.gov), checked 2026-11-14.
// data/rim_search.py lists the same craters with centres rounded a little
// differently; these are the Gazetteer's own values.
// labelSide says where the name goes, so names near the pole do not overlap.
const CRATERS = [
  { name: "Shackleton", lat: -89.67, lon: 129.78, diameterKm: 20.92, labelSide: "below" },
  { name: "de Gerlache", lat: -88.48, lon: -88.34, diameterKm: 32.71, labelSide: "left" },
  { name: "Haworth", lat: -87.45, lon: -5.17, diameterKm: 51.42, labelSide: "left" },
  { name: "Faustini", lat: -87.18, lon: 84.31, diameterKm: 42.48, labelSide: "above" },
  { name: "Malapert", lat: -85.0, lon: 11.4, diameterKm: 72.38, labelSide: "above" },
  { name: "Nobile", lat: -85.28, lon: 53.27, diameterKm: 79.27, labelSide: "right" },
  { name: "Amundsen", lat: -84.44, lon: 83.07, diameterKm: 103.39, labelSide: "below" },
  { name: "Cabeus", lat: -85.33, lon: -42.13, diameterKm: 100.58, labelSide: "left" },
  { name: "Sverdrup", lat: -88.32, lon: -153.39, diameterKm: 32.83, labelSide: "below" },
  { name: "Slater", lat: -88.08, lon: 111.29, diameterKm: 25.12, labelSide: "right" },
];

// Where each near pair's callout text sits, in SVG units, in the same order
// as NEAR_PAIRS. anchor "start" puts the text right of x, "end" left of it.
// Shackleton's goes lower right, which is empty ground. Sverdrup's goes left of
// its pins, between the "de Gerlache" name and the -88 ring label.
const PAIR_LABELS: { x: number; y: number; anchor: "start" | "end" }[] = [
  { x: 62, y: 62, anchor: "start" },
  { x: -32, y: 14, anchor: "end" },
];

// The selected pin's label: font size and a rough width per letter, in SVG
// units. Site names are long, so the label gets a solid box behind it. That
// keeps it readable where it crosses crater names, lines and other pins.
const PIN_LABEL_SIZE = 10;
const SANS_LETTER_WIDTH = 5.4;
const MONO_LETTER_WIDTH = 6.0;
const PIN_LABEL_PADDING = 4;

// Rounds to 2 decimals, for the picked point.
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function SouthPoleMap({
  rows,
  selectedSiteId,
  pickedPoint,
  onSelectSite,
  onPickPoint,
}: SouthPoleMapProps) {
  // A click on the map that did not land on a pin.
  function handleMapClick(event: React.MouseEvent<SVGSVGElement>) {
    // Turn screen pixels into SVG units. The SVG is square, so one scale works.
    const box = event.currentTarget.getBoundingClientRect();
    const scale = VIEW_SIZE / box.width;
    const x = (event.clientX - box.left) * scale - VIEW_SIZE / 2;
    const y = (event.clientY - box.top) * scale - VIEW_SIZE / 2;

    // Clicks outside the edge circle do nothing.
    const distanceFromCentre = Math.sqrt(x * x + y * y);
    if (distanceFromCentre > MAP_RADIUS) {
      return;
    }

    const point = unprojectSouthPole(x, y, MAP_RADIUS, EDGE_LAT);
    const lat = roundTo2(point.lat);
    const lon = roundTo2(point.lon);
    onPickPoint(lat, lon);
  }

  // Draw the selected pin last, so it sits on top of its neighbours.
  const pinRows: SiteRow[] = [];
  let selectedRow: SiteRow | null = null;
  for (const row of rows) {
    if (row.site.id === selectedSiteId) {
      selectedRow = row;
    } else {
      pinRows.push(row);
    }
  }
  if (selectedRow !== null) {
    pinRows.push(selectedRow);
  }

  // Clicking a pair callout switches between its two sites. They are only a
  // few pixels apart, so this is the easy way to reach the one underneath.
  function selectOtherInPair(siteIdA: string, siteIdB: string) {
    if (selectedSiteId === siteIdA) {
      onSelectSite(siteIdB);
    } else {
      onSelectSite(siteIdA);
    }
  }

  // One callout per near pair, if both of its sites are loaded.
  const pairCallouts: React.ReactNode[] = [];
  for (let pairIndex = 0; pairIndex < NEAR_PAIRS.length; pairIndex++) {
    const pair = NEAR_PAIRS[pairIndex];
    const label = PAIR_LABELS[pairIndex];
    let pairA: SiteRow | null = null;
    let pairB: SiteRow | null = null;
    for (const row of rows) {
      if (row.site.id === pair[0]) {
        pairA = row;
      }
      if (row.site.id === pair[1]) {
        pairB = row;
      }
    }
    if (pairA === null || pairB === null || label === undefined) {
      continue;
    }

    const siteIdA = pairA.site.id;
    const siteIdB = pairB.site.id;
    const a = projectSouthPole(pairA.site.lat, pairA.site.lon, MAP_RADIUS, EDGE_LAT);
    const b = projectSouthPole(pairB.site.lat, pairB.site.lon, MAP_RADIUS, EDGE_LAT);
    const middleX = (a.x + b.x) / 2;
    const middleY = (a.y + b.y) / 2;
    const km = distanceKm(pairA.site.lat, pairA.site.lon, pairB.site.lat, pairB.site.lon);

    // The leader line runs from the near end of the text to the ring.
    let lineStartX = label.x - 2;
    let lineEndX = middleX + 4;
    if (label.anchor === "end") {
      lineStartX = label.x + 2;
      lineEndX = middleX - 6;
    }
    let lineEndY = middleY + 4;
    if (label.anchor === "end") {
      lineEndY = middleY;
    }

    pairCallouts.push(
      <g
        key={"pair-" + siteIdA}
        role="button"
        tabIndex={0}
        aria-label={"Near pair, " + km.toFixed(1) + " km apart. Switch between the two sites"}
        className="cursor-pointer outline-none [&:focus-visible_text]:underline"
        onClick={(event) => {
          event.stopPropagation();
          selectOtherInPair(siteIdA, siteIdB);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectOtherInPair(siteIdA, siteIdB);
          }
        }}
      >
        <title>{"Two sites " + km.toFixed(1) + " km apart with very different light. Click to switch."}</title>
        {/* Leader line from the label to a small ring around both pins. */}
        <line
          x1={lineStartX}
          y1={label.y - 4}
          x2={lineEndX}
          y2={lineEndY}
          className="stroke-foreground"
          strokeWidth={0.75}
        />
        <circle cx={middleX} cy={middleY} r={6} className="fill-none stroke-foreground" strokeWidth={0.75} />
        <text
          x={label.x}
          y={label.y + 3}
          fontSize={9}
          textAnchor={label.anchor}
          className="fill-foreground font-mono tabular-nums"
        >
          {"pair · " + km.toFixed(1) + " km"}
        </text>
      </g>,
    );
  }

  let pickedCross: { x: number; y: number } | null = null;
  if (pickedPoint !== null) {
    pickedCross = projectSouthPole(pickedPoint.lat, pickedPoint.lon, MAP_RADIUS, EDGE_LAT);
  }

  return (
    <svg
      viewBox={-VIEW_SIZE / 2 + " " + -VIEW_SIZE / 2 + " " + VIEW_SIZE + " " + VIEW_SIZE}
      className="block h-auto w-full cursor-crosshair select-none"
      role="group"
      aria-label="Map of the lunar south pole. Click empty ground to pick a custom point."
      onClick={handleMapClick}
    >
      {/* Edge circle at latitude -80. Lines, rings and outlines are decoration,
          so they are hidden from screen readers. */}
      <circle
        aria-hidden="true"
        cx={0}
        cy={0}
        r={MAP_RADIUS}
        className="fill-background stroke-line"
        strokeWidth={1}
      />

      {/* Longitude spokes. */}
      {SPOKE_LONGITUDES.map((lon) => {
        const end = projectSouthPole(EDGE_LAT, lon, MAP_RADIUS, EDGE_LAT);
        return (
          <line
            aria-hidden="true"
            key={"spoke-" + lon}
            x1={0}
            y1={0}
            x2={end.x}
            y2={end.y}
            className="stroke-line"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Latitude rings, labelled along the bottom spoke (longitude 180). */}
      {LATITUDE_RINGS.map((lat) => {
        const ringRadius = projectSouthPole(lat, 180, MAP_RADIUS, EDGE_LAT).y;
        return (
          <g key={"ring-" + lat}>
            <circle
              aria-hidden="true"
              cx={0}
              cy={0}
              r={ringRadius}
              className="fill-none stroke-line"
              strokeWidth={0.5}
            />
            <text
              x={-3}
              y={ringRadius - 2}
              fontSize={8}
              textAnchor="end"
              className="fill-muted-foreground font-mono tabular-nums"
            >
              {lat + "°"}
            </text>
          </g>
        );
      })}

      {/* Earth is straight up, above longitude 0. */}
      <path
        aria-hidden="true"
        d={"M -4 " + (-MAP_RADIUS - 3) + " L 0 " + (-MAP_RADIUS - 10) + " L 4 " + (-MAP_RADIUS - 3) + " Z"}
        className="fill-muted-foreground"
      />
      <text
        x={8}
        y={-MAP_RADIUS - 4}
        fontSize={9}
        className="fill-muted-foreground"
      >
        Earth
      </text>

      {/* Craters: outline at the real diameter, name underneath. */}
      {CRATERS.map((crater) => {
        const centre = projectSouthPole(crater.lat, crater.lon, MAP_RADIUS, EDGE_LAT);
        const craterRadius = kmToMapPx(crater.diameterKm / 2, MAP_RADIUS, EDGE_LAT);

        // Put the name just outside the outline, on the chosen side.
        let labelX = centre.x;
        let labelY = centre.y + craterRadius + 9;
        let labelAnchor: "start" | "middle" | "end" = "middle";
        if (crater.labelSide === "above") {
          labelY = centre.y - craterRadius - 3;
        }
        if (crater.labelSide === "left") {
          labelX = centre.x - craterRadius - 3;
          labelY = centre.y + 3;
          labelAnchor = "end";
        }
        if (crater.labelSide === "right") {
          labelX = centre.x + craterRadius + 3;
          labelY = centre.y + 3;
          labelAnchor = "start";
        }
        return (
          <g key={"crater-" + crater.name}>
            <circle
              aria-hidden="true"
              cx={centre.x}
              cy={centre.y}
              r={craterRadius}
              className="fill-none stroke-muted-foreground/50"
              strokeWidth={0.75}
            />
            <text
              x={labelX}
              y={labelY}
              fontSize={8}
              textAnchor={labelAnchor}
              className="fill-muted-foreground"
            >
              {crater.name}
            </text>
          </g>
        );
      })}

      {pairCallouts}

      {/* Site pins. */}
      {pinRows.map((row) => {
        const site = row.site;
        const isSelected = site.id === selectedSiteId;
        const spot = projectSouthPole(site.lat, site.lon, MAP_RADIUS, EDGE_LAT);

        let dotRadius = 2.5;
        if (isSelected) {
          dotRadius = 4;
        }

        // Curated sites are filled dots, custom points are hollow.
        let dotClass = "fill-muted-foreground";
        if (row.isCustom) {
          dotClass = "fill-panel stroke-muted-foreground";
        }
        if (isSelected && row.isCustom) {
          dotClass = "fill-panel stroke-bright";
        }
        if (isSelected && !row.isCustom) {
          dotClass = "fill-bright";
        }

        // A custom point is named by its numbers, which use the mono font.
        let labelClass = "fill-bright font-medium";
        let letterWidth = SANS_LETTER_WIDTH;
        if (row.isCustom) {
          labelClass = "fill-bright font-mono tabular-nums";
          letterWidth = MONO_LETTER_WIDTH;
        }

        // The label sits above the pin, centred on it, pushed inwards near the
        // map's left and right edges.
        const labelWidth = site.name.length * letterWidth + 2 * PIN_LABEL_PADDING;
        const labelX = clampLabelX(spot.x, labelWidth, VIEW_SIZE / 2 - 2);
        // Pins right by the pole get their label a little higher, so it clears
        // the "de Gerlache" name that sits level with the pole.
        let labelY = spot.y - 11;
        const distanceFromPole = Math.sqrt(spot.x * spot.x + spot.y * spot.y);
        if (distanceFromPole < 20) {
          labelY = spot.y - 16;
        }

        function selectThisSite() {
          onSelectSite(site.id);
        }

        return (
          <g
            key={"pin-" + site.id}
            role="button"
            tabIndex={0}
            aria-label={site.name}
            aria-pressed={isSelected}
            className="group cursor-pointer outline-none"
            onClick={(event) => {
              // Stop the click here, so the map does not also pick a point.
              event.stopPropagation();
              selectThisSite();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectThisSite();
              }
            }}
          >
            <title>{site.name}</title>
            {/* A bigger invisible circle, so a small pin is still easy to click. */}
            <circle cx={spot.x} cy={spot.y} r={6} className="fill-transparent" />
            {/* Keyboard focus ring. */}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={10}
              className="hidden fill-none stroke-bright group-focus-visible:block"
              strokeWidth={0.75}
              strokeDasharray="2 2"
            />
            {isSelected && (
              <circle cx={spot.x} cy={spot.y} r={7} className="fill-none stroke-bright" strokeWidth={1} />
            )}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={dotRadius}
              className={dotClass}
              strokeWidth={1.25}
            />
            {isSelected && (
              <g aria-hidden="true">
                <rect
                  x={labelX - labelWidth / 2}
                  y={labelY - PIN_LABEL_SIZE}
                  width={labelWidth}
                  height={PIN_LABEL_SIZE + 4}
                  rx={2}
                  className="fill-background stroke-line"
                  strokeWidth={0.75}
                />
                <text
                  x={labelX}
                  y={labelY}
                  fontSize={PIN_LABEL_SIZE}
                  textAnchor="middle"
                  className={labelClass}
                >
                  {site.name}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* A small cross where the user last clicked empty ground. */}
      {pickedCross !== null && (
        <g aria-hidden="true" className="pointer-events-none stroke-bright" strokeWidth={1.25}>
          <line x1={pickedCross.x - 4} y1={pickedCross.y - 4} x2={pickedCross.x + 4} y2={pickedCross.y + 4} />
          <line x1={pickedCross.x - 4} y1={pickedCross.y + 4} x2={pickedCross.x + 4} y2={pickedCross.y - 4} />
        </g>
      )}
    </svg>
  );
}
