"""Build the JSON the app reads: one hourly series and one daily summary per site.

    python data/build.py --dem5 <5 m DEM .tif> --dem30 <30 m DEM .tif> --out data/out

Shapes are described in data/CONTRACT-DRAFT.md. Sun and Earth positions come from JPL
Horizons (needs internet), horizons from the LOLA DEMs (LRO LOLA DEM v4 S Pole).
A body counts as visible when its centre is above the terrain horizon at its azimuth.
"""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import rasterio

import horizons
import terrain
from horizon_mask import Horizon, visible_mask

MAX_RANGE_M = 25_000.0  # how far out to look for terrain that blocks the sky


def pick_dem(lat: float, lon: float, dem5: str, dem30: str) -> str:
    """Use the fine 5 m DEM when the whole search circle fits in it, else the 30 m one."""
    x, y = terrain.lonlat_to_xy(lat, lon)
    with rasterio.open(dem5) as d:
        half_width = min(d.bounds.right, d.bounds.top)
    return dem5 if math.hypot(x, y) + MAX_RANGE_M <= half_width else dem30


def longest_run(flags: np.ndarray) -> int:
    """Length of the longest run of False in a boolean array."""
    best = run = 0
    for f in flags:
        run = 0 if f else run + 1
        best = max(best, run)
    return best


def daily_summary(
    start: datetime,
    step_minutes: int,
    sun_elev: np.ndarray,
    sun_visible: np.ndarray,
    earth_visible: np.ndarray,
) -> list[dict]:
    """Per UTC day: hours of Sun, hours of Earth, highest Sun, longest Sun gap that day."""
    per_day = int(24 * 60 / step_minutes)
    hours = step_minutes / 60.0
    days = []
    for d in range(len(sun_elev) // per_day):
        s = slice(d * per_day, (d + 1) * per_day)
        days.append(
            {
                "date": (start + timedelta(days=d)).strftime("%Y-%m-%d"),
                "sun_hours": round(float(sun_visible[s].sum()) * hours, 2),
                "earth_hours": round(float(earth_visible[s].sum()) * hours, 2),
                "max_sun_elev_deg": round(float(sun_elev[s].max()), 3),
                "longest_sun_gap_hours": round(longest_run(sun_visible[s].astype(bool)) * hours, 2),
            }
        )
    return days


def build_site(site: dict, dem_path: str, start: datetime, days: int, step_minutes: int) -> tuple[dict, dict]:
    count = days * 24 * 60 // step_minutes
    horizon: Horizon = terrain.site_horizon(dem_path, site["lat"], site["lon"], max_range_m=MAX_RANGE_M)
    sun = horizons.fetch_series(horizons.SUN, site["lon"], site["lat"], start, count, step_minutes)
    earth = horizons.fetch_series(horizons.EARTH, site["lon"], site["lat"], start, count, step_minutes)

    sun_az = np.array([s.az_deg for s in sun])
    sun_el = np.array([s.elev_deg for s in sun])
    earth_az = np.array([s.az_deg for s in earth])
    earth_el = np.array([s.elev_deg for s in earth])
    sun_vis = visible_mask(horizon, sun_az, sun_el)
    earth_vis = visible_mask(horizon, earth_az, earth_el)

    series = {
        "id": site["id"],
        "start_utc": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "step_minutes": step_minutes,
        "count": count,
        "sun_elev_deg": np.round(sun_el, 3).tolist(),
        "sun_az_deg": np.round(sun_az, 2).tolist(),
        "earth_elev_deg": np.round(earth_el, 3).tolist(),
        "earth_az_deg": np.round(earth_az, 2).tolist(),
        "sun_visible": sun_vis.astype(int).tolist(),
        "earth_visible": earth_vis.astype(int).tolist(),
        "horizon": {
            "az_step_deg": float(horizon.az_deg[1] - horizon.az_deg[0]),
            "elev_deg": np.round(horizon.elev_deg, 3).tolist(),
        },
    }
    summary = {"id": site["id"], "days": daily_summary(start, step_minutes, sun_el, sun_vis, earth_vis)}
    return series, summary


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, separators=(",", ":")) + "\n")


def main() -> None:
    here = Path(__file__).parent
    p = argparse.ArgumentParser()
    p.add_argument("--dem5", default=str(here / "raw/LRO_LOLA_DEM_SPole875_5mp_v04.tif"))
    p.add_argument("--dem30", default=str(here / "raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif"))
    p.add_argument("--sites", default=str(here / "sites.json"))
    p.add_argument("--out", default=str(here / "out"))
    p.add_argument("--start", default="2027-01-01", help="UTC date, YYYY-MM-DD")
    p.add_argument("--days", type=int, default=365)
    p.add_argument("--step-minutes", type=int, default=60)
    p.add_argument("--only", help="build just this site id")
    args = p.parse_args()

    start = datetime.strptime(args.start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    sites = json.loads(Path(args.sites).read_text())
    out = Path(args.out)
    write_json(out / "sites.json", sites)
    for site in sites:
        if args.only and site["id"] != args.only:
            continue
        dem = pick_dem(site["lat"], site["lon"], args.dem5, args.dem30)
        print(f"{site['id']}: {Path(dem).name}", flush=True)
        series, summary = build_site(site, dem, start, args.days, args.step_minutes)
        write_json(out / "sites" / f"{site['id']}.json", series)
        write_json(out / "summary" / f"{site['id']}.json", summary)


if __name__ == "__main__":
    main()
