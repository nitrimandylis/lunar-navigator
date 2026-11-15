"use client";

import { useState } from "react";

import { NEAR_PAIRS, type PickedPoint, type SiteRow } from "@/lib/app-types";
import { CRATERS } from "@/lib/craters";
import { distanceKm } from "@/lib/geometry";
import { shortSiteName } from "@/lib/grid";
import {
  craterLabelSpot,
  kmToMapPx,
  projectForMap,
  unprojectSouthPole,
  type MapView,
} from "@/lib/map";

export type SouthPoleMapProps = {
  // Every site to pin, curated and custom.
  rows: SiteRow[];
  selectedSiteId: string | null;
  // The point the user clicked on the map and has not added yet, marked with a
  // cross. null if none. The navigator clears it once the point is added.
  pickedPoint: PickedPoint | null;
  // The part of the map to show. Leave it out for the whole map.
  view?: MapView;
  // How big the whole map is drawn on screen, in pixels across. Text and pins
  // are sized for SMALL_MAP_PX; a bigger map scales them down to match, so
  // they stay the same size on screen. Leave it out for the small map.
  drawnSizePx?: number;
  // Select a site. The selected hour stays as it is.
  onSelectSite: (siteId: string) => void;
  // The user clicked empty ground inside the map, at this point.
  onEmptyClick: (lat: number, lon: number) => void;
  // What a click on empty ground does, read out by screen readers.
  emptyClickHint: string;
};

// The SVG is drawn in a 340 by 340 box with the pole at (0, 0).
export const VIEW_SIZE = 340;
// Map radius in SVG units: the edge circle, latitude -82. Every curated site
// lies inside -82, so the map spends its space on the sites, not empty ground.
export const MAP_RADIUS = 152;
export const EDGE_LAT = -82;
// The shaded relief pictures under the map, made by data/basemap.py from the
// LOLA terrain. The first reaches the map edge. The second is sharper and
// reaches only to latitude -87.5, so it is drawn on top once zoomed in.
const BASEMAP_URL = "/data/basemap.png";
const FINE_BASEMAP_URL = "/data/basemap-87.5.png";
const FINE_BASEMAP_EDGE_LAT = -87.5;
export const FULL_VIEW: MapView = { x: -VIEW_SIZE / 2, y: -VIEW_SIZE / 2, size: VIEW_SIZE };

// Latitude rings every 2 degrees on the whole map, every degree once zoomed in
// a little, and every quarter degree once zoomed in a lot.
const WIDE_RINGS = [-88, -86, -84];
const MEDIUM_RINGS = [-89, -88, -87, -86, -85, -84, -83];
const FINE_RINGS: number[] = [];
for (let lat = -89.75; lat < -82; lat += 0.25) {
  FINE_RINGS.push(lat);
}
// The ring labels sit along this longitude, where no site pins are.
const RING_LABEL_LON = 160;

// The width the small map is drawn at, in pixels. Sizes below are in SVG
// units, picked to look right at this width.
const SMALL_MAP_PX = 300;

// Text sizes in SVG units.
const CRATER_LABEL_SIZE = 11;
const SMALL_LABEL_SIZE = 10;
// Labels on the map get a dark outline this wide, so they stay readable over
// the relief picture.
const LABEL_OUTLINE = 3;
const SPOKE_LONGITUDES = [0, 90, 180, 270];

// Where each near pair's callout text sits, in SVG units, in the same order
// as NEAR_PAIRS. anchor "start" puts the text right of x, "end" left of it.
// Both go lower left, which is empty ground, one under the other in the same
// order as the pairs themselves (Shackleton's is nearer the pole). That keeps
// each leader line short and stops it passing over the other pair.
const PAIR_LABELS: { x: number; y: number; anchor: "start" | "end" }[] = [
  { x: -44, y: 20, anchor: "end" },
  { x: -52, y: 38, anchor: "end" },
];

// The selected pin's label: font size and a rough width per letter, in SVG
// units. Site names are long, so the label gets a solid box behind it. That
// keeps it readable where it crosses crater names, lines and other pins.
const PIN_LABEL_SIZE = 12;
const SANS_LETTER_WIDTH = 6.5;
const MONO_LETTER_WIDTH = 7.2;
const PIN_LABEL_PADDING = 4;

// Rounds to 3 decimals (about 30 m of latitude), for a picked point.
function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// Turns a pointer position on screen into SVG units. The browser centres the
// square drawing inside a box that is often taller or wider than it, so the
// box edges are not the drawing's edges. getScreenCTM is the browser's own
// SVG-to-screen mapping; its inverse undoes it exactly, at any zoom.
export function screenToMap(svg: SVGSVGElement, clientX: number, clientY: number) {
  const svgToScreen = svg.getScreenCTM();
  if (svgToScreen === null) {
    return null;
  }
  const point = new DOMPoint(clientX, clientY).matrixTransform(svgToScreen.inverse());
  return { x: point.x, y: point.y };
}

// The latitude and longitude under a pointer, rounded to 3 decimals, or null
// when the pointer is outside the edge circle.
export function latLonAt(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = screenToMap(svg, clientX, clientY);
  if (point === null) {
    return null;
  }
  const distanceFromCentre = Math.sqrt(point.x * point.x + point.y * point.y);
  if (distanceFromCentre > MAP_RADIUS) {
    return null;
  }
  const latLon = unprojectSouthPole(point.x, point.y, MAP_RADIUS, EDGE_LAT);
  return { lat: roundTo3(latLon.lat), lon: roundTo3(latLon.lon) };
}

export function SouthPoleMap({
  rows,
  selectedSiteId,
  pickedPoint,
  view = FULL_VIEW,
  drawnSizePx = SMALL_MAP_PX,
  onSelectSite,
  onEmptyClick,
  emptyClickHint,
}: SouthPoleMapProps) {
  // The pin under the pointer. Its name shows, like the selected pin's.
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);

  // Everything is drawn in map units, so zooming in, or drawing the map
  // bigger, would make text, pins and lines grow too. Multiplying their sizes
  // by k keeps them the same size on screen. k is 1 for the small whole map.
  const k = (view.size / VIEW_SIZE) * (SMALL_MAP_PX / drawnSizePx);

  // A click on the map that did not land on a pin.
  function handleMapClick(event: React.MouseEvent<SVGSVGElement>) {
    const point = latLonAt(event.currentTarget, event.clientX, event.clientY);
    // Clicks outside the edge circle do nothing.
    if (point === null) {
      return;
    }
    onEmptyClick(point.lat, point.lon);
  }

  // Finer rings the more of the map's width is on screen per pixel.
  let latitudeRings = WIDE_RINGS;
  if (k < 0.3) {
    latitudeRings = MEDIUM_RINGS;
  }
  if (k < 0.04) {
    latitudeRings = FINE_RINGS;
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
  // Zoomed in, the two sites of a pair sit apart and the callout is not needed.
  const pairCallouts: React.ReactNode[] = [];
  for (let pairIndex = 0; pairIndex < NEAR_PAIRS.length && view.size > VIEW_SIZE / 2; pairIndex++) {
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
    const a = projectForMap(pairA.site.lat, pairA.site.lon, MAP_RADIUS, EDGE_LAT);
    const b = projectForMap(pairB.site.lat, pairB.site.lon, MAP_RADIUS, EDGE_LAT);
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
          strokeWidth={0.75 * k}
        />
        <circle cx={middleX} cy={middleY} r={6 * k} className="fill-none stroke-foreground" strokeWidth={0.75 * k} />
        <text
          x={label.x}
          y={label.y + 3}
          fontSize={CRATER_LABEL_SIZE * k}
          textAnchor={label.anchor}
          paintOrder="stroke"
          strokeWidth={LABEL_OUTLINE * k}
          className="fill-foreground stroke-background tabular-nums"
        >
          {"pair, " + km.toFixed(1) + " km apart"}
        </text>
      </g>,
    );
  }

  // Only the pin under the pointer (or keyboard focus) gets a name, so names
  // never cover other pins. The selected pin is marked by its ring, and its
  // name is in the selected site panel.
  const labelledIds: string[] = [];
  if (hoveredSiteId !== null) {
    labelledIds.push(hoveredSiteId);
  }

  // How far the sharper relief picture reaches from the pole, in map units.
  const fineRadius = projectForMap(FINE_BASEMAP_EDGE_LAT, 180, MAP_RADIUS, EDGE_LAT).y;
  // The sharper picture is a big file, so it loads only once zoomed in.
  const showFineBasemap = view.size < VIEW_SIZE / 2;

  let pickedCross: { x: number; y: number } | null = null;
  if (pickedPoint !== null) {
    pickedCross = projectForMap(pickedPoint.lat, pickedPoint.lon, MAP_RADIUS, EDGE_LAT);
  }

  return (
    <svg
      viewBox={view.x + " " + view.y + " " + view.size + " " + view.size}
      className="block size-full select-none"
      role="group"
      aria-label={"Map of the lunar south pole. " + emptyClickHint}
      onClick={handleMapClick}
    >
      {/* Edge circle at latitude -82. Lines, rings and outlines are decoration,
          so they are hidden from screen readers. */}
      <circle
        aria-hidden="true"
        cx={0}
        cy={0}
        r={MAP_RADIUS}
        className="fill-background stroke-line"
        strokeWidth={k}
      />

      {/* Shaded relief of the ground. Both pictures are round, with the pole
          in the middle and longitude 0 at the top, like the map itself. They
          are dimmed together, so no edge shows where the sharper one ends. */}
      <g aria-hidden="true" className="pointer-events-none opacity-45">
        <image
          href={BASEMAP_URL}
          x={-MAP_RADIUS}
          y={-MAP_RADIUS}
          width={2 * MAP_RADIUS}
          height={2 * MAP_RADIUS}
        />
        {showFineBasemap && (
          <image
            href={FINE_BASEMAP_URL}
            x={-fineRadius}
            y={-fineRadius}
            width={2 * fineRadius}
            height={2 * fineRadius}
          />
        )}
      </g>

      {/* Longitude spokes. */}
      {SPOKE_LONGITUDES.map((lon) => {
        const end = projectForMap(EDGE_LAT, lon, MAP_RADIUS, EDGE_LAT);
        return (
          <line
            aria-hidden="true"
            key={"spoke-" + lon}
            x1={0}
            y1={0}
            x2={end.x}
            y2={end.y}
            className="stroke-line"
            strokeWidth={0.5 * k}
          />
        );
      })}

      {/* Latitude rings, labelled along one spoke where no pins are. */}
      {latitudeRings.map((lat) => {
        const ringRadius = projectForMap(lat, 180, MAP_RADIUS, EDGE_LAT).y;
        const labelSpot = projectForMap(lat, RING_LABEL_LON, MAP_RADIUS, EDGE_LAT);
        return (
          <g key={"ring-" + lat}>
            <circle
              aria-hidden="true"
              cx={0}
              cy={0}
              r={ringRadius}
              className="fill-none stroke-line"
              strokeWidth={0.5 * k}
            />
            <text
              x={labelSpot.x + 3 * k}
              y={labelSpot.y + 4 * k}
              fontSize={SMALL_LABEL_SIZE * k}
              paintOrder="stroke"
              strokeWidth={LABEL_OUTLINE * k}
              className="fill-muted-foreground stroke-background font-mono tabular-nums"
            >
              {lat + "°"}
            </text>
          </g>
        );
      })}

      {/* Earth is straight up, above longitude 0. */}
      <path
        aria-hidden="true"
        d={
          "M " + -4 * k + " " + (-MAP_RADIUS - 3 * k) +
          " L 0 " + (-MAP_RADIUS - 10 * k) +
          " L " + 4 * k + " " + (-MAP_RADIUS - 3 * k) + " Z"
        }
        className="fill-muted-foreground"
      />
      <text
        x={8 * k}
        y={-MAP_RADIUS - 4 * k}
        fontSize={SMALL_LABEL_SIZE * k}
        className="fill-muted-foreground"
      >
        Earth
      </text>

      {/* Craters: outline at the real diameter, name underneath. */}
      {CRATERS.map((crater) => {
        const centre = projectForMap(crater.lat, crater.lon, MAP_RADIUS, EDGE_LAT);
        const craterRadius = kmToMapPx(crater.diameterKm / 2, MAP_RADIUS, EDGE_LAT);

        // The name goes just outside the outline, on the chosen side.
        const labelSize = CRATER_LABEL_SIZE * k;
        const label = craterLabelSpot(centre, craterRadius, crater.labelSide, 3 * k, labelSize);
        return (
          <g key={"crater-" + crater.name}>
            <circle
              aria-hidden="true"
              cx={centre.x}
              cy={centre.y}
              r={craterRadius}
              className="fill-none stroke-muted-foreground/35"
              strokeWidth={0.75 * k}
            />
            <text
              x={label.x}
              y={label.y}
              fontSize={labelSize}
              textAnchor={label.anchor}
              paintOrder="stroke"
              strokeWidth={LABEL_OUTLINE * k}
              className="fill-foreground stroke-background italic"
            >
              {crater.name}
            </text>
          </g>
        );
      })}

      {pairCallouts}

      {/* Site pins: dots first, then the names on top of every dot. */}
      {pinRows.map((row) => {
        const site = row.site;
        const isSelected = site.id === selectedSiteId;
        const spot = projectForMap(site.lat, site.lon, MAP_RADIUS, EDGE_LAT);

        let dotRadius = 3.5;
        if (isSelected) {
          dotRadius = 4.5;
        }

        // Curated sites are filled dots, custom points are hollow. Real
        // mission targets get a bright outer ring, like their grid tag.
        const isMission = site.mission !== undefined;
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
            onMouseEnter={() => setHoveredSiteId(site.id)}
            onMouseLeave={() => setHoveredSiteId(null)}
            onFocus={() => setHoveredSiteId(site.id)}
            onBlur={() => setHoveredSiteId(null)}
          >
            {/* A bigger invisible circle, so a small pin is still easy to click. */}
            <circle cx={spot.x} cy={spot.y} r={7 * k} className="fill-transparent" />
            {/* Keyboard focus ring. */}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={10 * k}
              className="hidden fill-none stroke-bright group-focus-visible:block"
              strokeWidth={0.75 * k}
              strokeDasharray={2 * k + " " + 2 * k}
            />
            {isMission && !isSelected && (
              <circle cx={spot.x} cy={spot.y} r={6 * k} className="fill-none stroke-bright" strokeWidth={1.25 * k} />
            )}
            {isSelected && (
              <circle cx={spot.x} cy={spot.y} r={8.5 * k} className="fill-none stroke-bright" strokeWidth={1.5 * k} />
            )}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={dotRadius * k}
              className={dotClass}
              strokeWidth={1.25 * k}
            />
          </g>
        );
      })}

      {/* The hovered pin's name, in a box so it stays
          readable over lines and other pins. It never catches the pointer. */}
      {labelledIds.map((siteId) => {
        let labelRow: SiteRow | null = null;
        for (const row of rows) {
          if (row.site.id === siteId) {
            labelRow = row;
          }
        }
        if (labelRow === null) {
          return null;
        }
        const site = labelRow.site;
        const spot = projectForMap(site.lat, site.lon, MAP_RADIUS, EDGE_LAT);

        // A custom point is named by its numbers, which use the mono font.
        let labelClass = "fill-bright font-medium";
        let letterWidth = SANS_LETTER_WIDTH;
        if (labelRow.isCustom) {
          labelClass = "fill-bright font-mono tabular-nums";
          letterWidth = MONO_LETTER_WIDTH;
        }

        // The box sits above the pin, clear of its selection ring, and is
        // pushed back inside the view near the left and right edges.
        const labelText = shortSiteName(site.name);
        const labelWidth = (labelText.length * letterWidth + 2 * PIN_LABEL_PADDING) * k;
        const labelHeight = (PIN_LABEL_SIZE + 5) * k;
        const viewLeft = view.x + 2 * k;
        const viewRight = view.x + view.size - 2 * k;
        let labelX = spot.x;
        labelX = Math.min(labelX, viewRight - labelWidth / 2);
        labelX = Math.max(labelX, viewLeft + labelWidth / 2);
        const labelBottom = spot.y - 11 * k;

        return (
          <g key={"label-" + siteId} aria-hidden="true" className="pointer-events-none">
            <rect
              x={labelX - labelWidth / 2}
              y={labelBottom - labelHeight}
              width={labelWidth}
              height={labelHeight}
              rx={2 * k}
              className="fill-background stroke-line"
              strokeWidth={0.75 * k}
            />
            <text
              x={labelX}
              y={labelBottom - 4.5 * k}
              fontSize={PIN_LABEL_SIZE * k}
              textAnchor="middle"
              className={labelClass}
            >
              {labelText}
            </text>
          </g>
        );
      })}

      {/* A small cross where the user last clicked empty ground. */}
      {pickedCross !== null && (
        <g aria-hidden="true" className="pointer-events-none stroke-bright" strokeWidth={1.5 * k}>
          <line x1={pickedCross.x - 5 * k} y1={pickedCross.y - 5 * k} x2={pickedCross.x + 5 * k} y2={pickedCross.y + 5 * k} />
          <line x1={pickedCross.x - 5 * k} y1={pickedCross.y + 5 * k} x2={pickedCross.x + 5 * k} y2={pickedCross.y - 5 * k} />
        </g>
      )}
    </svg>
  );
}
