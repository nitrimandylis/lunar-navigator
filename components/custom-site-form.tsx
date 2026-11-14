import type { PickedPoint } from "@/lib/app-types";

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

// Latitude and longitude fields for adding a custom point. Placeholder.
export function CustomSiteForm({ customCount }: CustomSiteFormProps) {
  return (
    <p className="text-sm text-muted-foreground">
      Latitude and longitude fields will show here. Custom points so far:{" "}
      <span className="font-mono tabular-nums">{customCount}</span>
    </p>
  );
}
