"use client";

import { useState } from "react";

import type { Hourly } from "@/lib/app-types";
import type { Site } from "@/lib/data";
import { hourlyCsv, shareQuery } from "@/lib/share";
import { FIRST_YEAR, LAST_YEAR } from "@/lib/time";

export type SiteActionsProps = {
  // The selected site, or null when nothing is selected.
  site: Site | null;
  // True for a point the user typed in. A link cannot bring one back.
  isCustom: boolean;
  // The selected site's hourly data, or null while it is still loading.
  hourly: Hourly | null;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
};

const BUTTON_CLASS =
  "min-h-10 rounded-md bg-neither px-2.5 py-1 text-sm text-bright disabled:opacity-50 lg:min-h-0";

// Two buttons under the selected site: copy a link to this site and hour, and
// download the site's hourly numbers for every year as a CSV file.
export function SiteActions({ site, isCustom, hourly, selectedHour }: SiteActionsProps) {
  // What the copy button says: it changes for a moment after a click.
  const [copyLabel, setCopyLabel] = useState("Copy link");

  if (site === null) {
    return null;
  }
  // A const, so the functions below know the site is not null.
  const selectedSite = site;

  async function copyLink() {
    const query = shareQuery(selectedSite.id, selectedHour);
    // Put the link in the address bar too, so it can be copied from there.
    window.history.replaceState(null, "", query);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLabel("Link copied");
    } catch {
      // The browser refused the clipboard. The link is still in the address bar.
      setCopyLabel("Link is in the address bar");
    }
    setTimeout(() => setCopyLabel("Copy link"), 2000);
  }

  function downloadCsv() {
    if (hourly === null) {
      return;
    }
    // Make the text a file in memory, then click a link to it.
    const file = new Blob([hourlyCsv(hourly)], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedSite.id + "-" + FIRST_YEAR + "-" + LAST_YEAR + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* A custom point only exists in this browser tab, so it has no link. */}
      {!isCustom && (
        <button type="button" onClick={copyLink} className={BUTTON_CLASS}>
          {copyLabel}
        </button>
      )}
      <button
        type="button"
        onClick={downloadCsv}
        disabled={hourly === null}
        title={
          "Every hour from " +
          FIRST_YEAR +
          " to " +
          LAST_YEAR +
          ": Sun and Earth elevation, azimuth and visibility"
        }
        className={BUTTON_CLASS}
      >
        Download CSV
      </button>
    </div>
  );
}
