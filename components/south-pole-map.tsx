import type { SiteRow } from "@/lib/app-types";

export type SouthPoleMapProps = {
  // Every site to pin, curated and custom.
  rows: SiteRow[];
  selectedSiteId: string | null;
  // Select a site. The selected hour stays as it is.
  onSelectSite: (siteId: string) => void;
  // The user clicked empty ground: offer this point to the custom point form.
  onPickPoint: (lat: number, lon: number) => void;
};

// The south pole locator map. Placeholder.
export function SouthPoleMap({ rows }: SouthPoleMapProps) {
  return (
    <p className="text-sm text-muted-foreground">
      The locator map will show {rows.length} sites here.
    </p>
  );
}
