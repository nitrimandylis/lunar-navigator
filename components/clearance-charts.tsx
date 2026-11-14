import type { Hourly, SiteRow } from "@/lib/app-types";

export type ClearanceChartsProps = {
  // The selected site, or null when nothing is selected.
  row: SiteRow | null;
  // The selected site's hourly data, or null while it is still loading.
  hourly: Hourly | null;
  // The month to show. 0 = January.
  visibleMonth: number;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
};

// The Sun and Earth clearance charts. Placeholder.
export function ClearanceCharts({ row }: ClearanceChartsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-28 rounded-md border border-line p-3">
        <h3 className="text-sm text-foreground">Sun</h3>
        <p className="text-sm text-muted-foreground">
          {row === null
            ? "Degrees above or below the terrain horizon over time."
            : "Chart for " + row.site.name + " goes here."}
        </p>
      </div>
      <div className="h-28 rounded-md border border-line p-3">
        <h3 className="text-sm text-foreground">Earth</h3>
        <p className="text-sm text-muted-foreground">
          Degrees above or below the terrain horizon over time.
        </p>
      </div>
    </div>
  );
}
