"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MAX_CUSTOM_SITES, type PickedPoint } from "@/lib/app-types";
import { validateCustomPoint } from "@/lib/custom-point-input";

export type CustomSiteFormProps = {
  // A point clicked on the map, to fill the fields with. null if none.
  pickedPoint: PickedPoint | null;
  // How many custom sites exist already. The limit is MAX_CUSTOM_SITES.
  customCount: number;
  // A message when adding failed (for example the data did not load).
  error: string | null;
  // Add a custom site. Only call this with a valid point.
  onAdd: (lat: number, lon: number) => void;
};

// Map clicks give long decimals. Three places is about 30 m on the Moon.
function formatCoordinate(value: number): string {
  return value.toFixed(3);
}

const inputClass =
  "h-8 w-full rounded-md border border-line bg-background px-2 font-mono text-sm tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-bright disabled:opacity-50";

// Latitude and longitude fields for adding a custom point.
export function CustomSiteForm({
  pickedPoint,
  customCount,
  error,
  onAdd,
}: CustomSiteFormProps) {
  const [latText, setLatText] = useState(
    pickedPoint === null ? "" : formatCoordinate(pickedPoint.lat),
  );
  const [lonText, setLonText] = useState(
    pickedPoint === null ? "" : formatCoordinate(pickedPoint.lon),
  );
  const [message, setMessage] = useState<string | null>(null);

  // When the map hands over a new point, copy it into the fields. This runs
  // during render instead of in an effect, so the fields never show the old
  // point for a frame. The user still has to press "Add site".
  const [lastPickedPoint, setLastPickedPoint] = useState(pickedPoint);
  if (pickedPoint !== lastPickedPoint) {
    setLastPickedPoint(pickedPoint);
    if (pickedPoint !== null) {
      setLatText(formatCoordinate(pickedPoint.lat));
      setLonText(formatCoordinate(pickedPoint.lon));
      setMessage(null);
    }
  }

  const isFull = customCount >= MAX_CUSTOM_SITES;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page.
    event.preventDefault();

    const result = validateCustomPoint(latText, lonText);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage(null);
    setLatText("");
    setLonText("");
    onAdd(result.lat, result.lon);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Latitude
          {/* Text, not type="number", so the check sees exactly what was typed. */}
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="-89.33"
            value={latText}
            onChange={(event) => setLatText(event.target.value)}
            disabled={isFull}
            aria-invalid={message !== null}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Longitude
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="116.84"
            value={lonText}
            onChange={(event) => setLonText(event.target.value)}
            disabled={isFull}
            aria-invalid={message !== null}
            className={inputClass}
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Latitude <span className="font-mono tabular-nums">-90</span> to{" "}
        <span className="font-mono tabular-nums">90</span>. Longitude east,{" "}
        <span className="font-mono tabular-nums">-180</span> to{" "}
        <span className="font-mono tabular-nums">360</span>.
      </p>

      {message !== null && (
        <p role="alert" className="text-sm text-bright">
          {message}
        </p>
      )}
      {error !== null && (
        <p role="alert" className="text-sm text-bright">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isFull}
          className="focus-visible:ring-2 focus-visible:ring-bright"
        >
          Add site
        </Button>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {customCount} of {MAX_CUSTOM_SITES}
          </span>{" "}
          custom points
        </span>
      </div>

      {isFull && (
        <p className="text-sm text-muted-foreground">
          Limit reached. Remove a custom point in the grid to add another.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Flat horizon, no terrain: near the pole that gives far too many Sun hours.
        For real numbers, use the curated sites.
      </p>
    </form>
  );
}
