import type { Hourly, SiteRow } from "@/lib/app-types";
import { formatHour } from "@/lib/time";

export type SelectedSiteProps = {
  // The selected site, or null when nothing is selected.
  row: SiteRow | null;
  // The selected site's hourly data, or null while it is still loading.
  hourly: Hourly | null;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
};

// Numbers for the selected site and hour. Placeholder: name and time only.
export function SelectedSite({ row, selectedHour }: SelectedSiteProps) {
  if (row === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No site selected. Solar elevation, time to sunset and time to Earthset
        will show here.
      </p>
    );
  }

  return (
    <div className="text-sm">
      <p className="text-bright">{row.site.name}</p>
      <p className="font-mono tabular-nums text-muted-foreground">
        {formatHour(selectedHour)}
      </p>
    </div>
  );
}
