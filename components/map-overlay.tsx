"use client";

import { useEffect, useRef, useState } from "react";

import { CustomSiteForm } from "@/components/custom-site-form";
import { MAX_CUSTOM_SITES, type PickedPoint, type SiteRow } from "@/lib/app-types";
import { clampView, zoomView, type MapView } from "@/lib/map";
import { FULL_VIEW, MAP_RADIUS, SouthPoleMap, latLonAt, screenToMap } from "@/components/south-pole-map";

export type MapOverlayProps = {
  rows: SiteRow[];
  selectedSiteId: string | null;
  pickedPoint: PickedPoint | null;
  // How many custom points exist already. The limit is MAX_CUSTOM_SITES.
  customCount: number;
  // A message when adding a custom point failed, or null.
  customError: string | null;
  onSelectSite: (siteId: string) => void;
  onPickPoint: (lat: number, lon: number) => void;
  // Add the picked point as a custom site.
  onAddPoint: (lat: number, lon: number) => void;
  onClose: () => void;
};

// The smallest view is 5 map units across: about 68 times closer than the
// whole map, roughly 8 km wide, so sites 2 km apart sit well apart.
const MIN_VIEW_SIZE = 5;
// One wheel step or button press zooms by this much.
const ZOOM_STEP = 1.25;
// Text and pins on the big map are this many times bigger than on the small one.
const OVERLAY_TEXT_SCALE = 1.35;
// A press that moves less than this many pixels is a click, not a drag.
const DRAG_THRESHOLD_PX = 4;

// The big map: a full-screen overlay with wheel zoom, drag to pan, the
// latitude and longitude under the pointer, and click to pick a point.
export function MapOverlay({
  rows,
  selectedSiteId,
  pickedPoint,
  customCount,
  customError,
  onSelectSite,
  onPickPoint,
  onAddPoint,
  onClose,
}: MapOverlayProps) {
  const isCustomFull = customCount >= MAX_CUSTOM_SITES;
  const [view, setView] = useState<MapView>(FULL_VIEW);
  const [pointerLatLon, setPointerLatLon] = useState<PickedPoint | null>(null);
  // How many pixels across the map is drawn. Measured once it is on screen
  // and again whenever the window changes size.
  const [drawnSizePx, setDrawnSizePx] = useState(600);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Where a drag started, and whether the pointer has moved far enough to
  // count as a drag. A drag must not also pick a point when it ends.
  const dragStart = useRef<{ clientX: number; clientY: number; view: MapView } | null>(null);
  const didDrag = useRef(false);

  // The latest onClose, so the Escape listener below is set up only once.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes the overlay. Focus starts on the close button.
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

  useEffect(() => {
    const box = boxRef.current;
    if (box === null) {
      return;
    }
    // The map is square and drawn as large as fits, so the shorter side counts.
    const observer = new ResizeObserver(() => {
      setDrawnSizePx(Math.min(box.clientWidth, box.clientHeight));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  function getSvg(): SVGSVGElement | null {
    if (boxRef.current === null) {
      return null;
    }
    return boxRef.current.querySelector("svg");
  }

  // Zooms around a point in map units.
  function zoomAround(focusX: number, focusY: number, factor: number) {
    setView((previous) =>
      clampView(zoomView(previous, focusX, focusY, factor, MIN_VIEW_SIZE, FULL_VIEW.size), MAP_RADIUS),
    );
  }

  // Zooms around the middle of the view, for the + and - buttons.
  function zoomAroundCentre(factor: number) {
    zoomAround(view.x + view.size / 2, view.y + view.size / 2, factor);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const svg = getSvg();
    if (svg === null) {
      return;
    }
    const focus = screenToMap(svg, event.clientX, event.clientY);
    if (focus === null) {
      return;
    }
    // Wheel down (positive deltaY) zooms out, wheel up zooms in.
    let factor = 1 / ZOOM_STEP;
    if (event.deltaY > 0) {
      factor = ZOOM_STEP;
    }
    zoomAround(focus.x, focus.y, factor);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStart.current = { clientX: event.clientX, clientY: event.clientY, view: view };
    didDrag.current = false;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const svg = getSvg();
    if (svg !== null) {
      setPointerLatLon(latLonAt(svg, event.clientX, event.clientY));
    }

    const start = dragStart.current;
    if (start === null || svg === null) {
      return;
    }
    const movedX = event.clientX - start.clientX;
    const movedY = event.clientY - start.clientY;
    if (!didDrag.current && Math.hypot(movedX, movedY) < DRAG_THRESHOLD_PX) {
      return;
    }
    if (!didDrag.current) {
      didDrag.current = true;
      // Keep getting moves even if the pointer leaves the map.
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    // The map is square and drawn as large as fits, so the shorter side of
    // the SVG box is the drawn width. Moving the pointer right moves the map
    // right, which means the view moves left.
    const box = svg.getBoundingClientRect();
    const unitsPerPixel = start.view.size / Math.min(box.width, box.height);
    setView(
      clampView(
        {
          x: start.view.x - movedX * unitsPerPixel,
          y: start.view.y - movedY * unitsPerPixel,
          size: start.view.size,
        },
        MAP_RADIUS,
      ),
    );
  }

  function handlePointerUp() {
    dragStart.current = null;
  }

  // Clicks right after a drag are the end of the drag, so they are ignored.
  function handleEmptyClick(lat: number, lon: number) {
    if (didDrag.current) {
      return;
    }
    onPickPoint(lat, lon);
  }

  function handleSelectSite(siteId: string) {
    if (didDrag.current) {
      return;
    }
    onSelectSite(siteId);
  }

  // How much closer than the whole map, for the readout.
  const zoomTimes = FULL_VIEW.size / view.size;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="South pole map, zoomed"
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/85 p-4 backdrop-blur-sm duration-200 fade-in motion-reduce:animate-none"
    >
      <div className="flex h-full max-h-[calc(100dvh-2rem)] w-full max-w-[min(100%,calc(100dvh+12rem))] animate-in duration-200 fade-in slide-in-from-bottom-2 motion-reduce:animate-none flex-col rounded-lg border border-line bg-panel lg:max-w-[min(100%,calc(100dvh+30rem))]">
        <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-2 text-sm">
          <h2 className="font-medium text-bright">South pole</h2>
          <p className="font-mono tabular-nums text-muted-foreground">
            {pointerLatLon === null
              ? "Point at the map for coordinates"
              : pointerLatLon.lat.toFixed(3) + "°, " + pointerLatLon.lon.toFixed(3) + "°"}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {zoomTimes.toFixed(1)}×
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomAroundCentre(1 / ZOOM_STEP)}
              className="rounded-md bg-neither px-2.5 py-1 text-bright"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomAroundCentre(ZOOM_STEP)}
              className="rounded-md bg-neither px-2.5 py-1 text-bright"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setView(FULL_VIEW)}
              className="rounded-md bg-neither px-2.5 py-1"
            >
              Whole map
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close the map"
              onClick={onClose}
              className="rounded-md bg-neither px-2.5 py-1 text-bright"
            >
              ×
            </button>
          </div>
        </header>

        {/* The map, and from lg the custom point form in a strip on its right. */}
        <div className="flex min-h-0 flex-1">
          <div
            ref={boxRef}
            className="min-h-0 min-w-0 flex-1 cursor-crosshair touch-none p-2"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => setPointerLatLon(null)}
          >
            <SouthPoleMap
              rows={rows}
              selectedSiteId={selectedSiteId}
              pickedPoint={pickedPoint}
              view={view}
              drawnSizePx={drawnSizePx / OVERLAY_TEXT_SCALE}
              onSelectSite={handleSelectSite}
              onEmptyClick={handleEmptyClick}
              emptyClickHint="Scroll to zoom, drag to move, click empty ground to pick a point."
            />
          </div>
          {/* A click on the map fills the two fields. Typing reaches the whole
              Moon; clicks stay inside this map. Below lg the form has its own
              panel under the small map, so it is not shown here. */}
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-line p-4 max-lg:hidden">
            <h3 className="mb-2 text-sm font-medium text-bright">Add a custom point</h3>
            <CustomSiteForm
              pickedPoint={pickedPoint}
              customCount={customCount}
              error={customError}
              onAdd={onAddPoint}
            />
          </aside>
        </div>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-2 text-sm">
          {/* From lg the hint is always here: the picked point shows in the
              form on the right, which has its own Add button. */}
          <p className={pickedPoint === null ? "text-muted-foreground" : "text-muted-foreground max-lg:hidden"}>
            Scroll to zoom, drag to move. Click empty ground to pick a point.
          </p>
          {pickedPoint !== null && (
            <div className="contents lg:hidden">
              <p className="font-mono tabular-nums text-bright">
                Picked {pickedPoint.lat.toFixed(3)}°, {pickedPoint.lon.toFixed(3)}°
              </p>
              <button
                type="button"
                disabled={isCustomFull}
                onClick={() => onAddPoint(pickedPoint.lat, pickedPoint.lon)}
                className="rounded-md bg-bright px-3 py-1 font-medium text-background disabled:opacity-50"
              >
                Add as custom point
              </button>
              {isCustomFull && (
                <p className="text-muted-foreground">
                  3 custom points already. Remove one in the grid first.
                </p>
              )}
              {customError !== null && (
                <p role="alert" className="text-bright">
                  {customError}
                </p>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
