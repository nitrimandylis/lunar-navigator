import type { Hourly, SiteRow } from "@/lib/app-types";

export type SitesGridProps = {
  // Already sorted: draw them in this order.
  rows: SiteRow[];
  // The month to show. 0 = January.
  visibleMonth: number;
  selectedSiteId: string | null;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
  // Hourly data that has been loaded so far, by site id.
  hourlyBySite: Record<string, Hourly>;
  // Select a site and an hour together.
  onSelect: (siteId: string, hour: number) => void;
  // Ask for a site's hourly data. It shows up in hourlyBySite when loaded.
  onRequestHourly: (siteId: string) => void;
  onRemoveCustom: (siteId: string) => void;
};

// The site-by-day grid. Placeholder: lists the site names.
export function SitesGrid({ rows, selectedSiteId, selectedHour, onSelect }: SitesGridProps) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {rows.map((row) => (
        <li key={row.site.id}>
          <button
            type="button"
            onClick={() => onSelect(row.site.id, selectedHour)}
            className={row.site.id === selectedSiteId ? "font-medium text-bright" : ""}
          >
            {row.site.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
