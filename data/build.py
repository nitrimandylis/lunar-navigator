"""Build the JSON the app reads: one hourly series and one daily summary per site.

    python data/build.py --dem5 <5 m DEM .tif> --dem30 <30 m DEM .tif> --out public/data

Shapes are described in the Contract section of AGENTS.md. Sun and Earth positions come from JPL
Horizons (needs internet), horizons from the LOLA DEMs (LRO LOLA DEM v4 S Pole).
A body counts as visible when any part of its disc is above the terrain horizon.
"""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import rasterio

import ephemeris
import horizons
import terrain
from horizon_mask import Horizon, disc_visible_mask, earth_angular_radius_deg, sun_angular_radius_deg

MAX_RANGE_M = 25_000.0  # full-detail terrain search
FAR_RANGE_M = 150_000.0  # coarser search beyond that: a 5 km peak is visible from ~130 km


def pick_dem(lat: float, lon: float, dem5: str, dem30: str) -> str:
    """Use the fine 5 m DEM when the whole search circle fits in it, else the 30 m one."""
    x, y = terrain.lonlat_to_xy(lat, lon)
    with rasterio.open(dem5) as d:
        half_width = min(d.bounds.right, d.bounds.top)
    return dem5 if math.hypot(x, y) + MAX_RANGE_M <= half_width else dem30


def dark_run_lengths(visible: np.ndarray) -> np.ndarray:
    """For every hour, the length (in hours) of the unbroken dark spell it belongs to; 0 when lit."""
    n = len(visible)
    out = np.zeros(n, dtype=int)
    i = 0
    while i < n:
        if visible[i]:
            i += 1
            continue
        j = i
        while j < n and not visible[j]:
            j += 1
        out[i:j] = j - i
        i = j
    return out


def daily_summary(
    start: datetime,
    step_minutes: int,
    sun_elev: np.ndarray,
    sun_visible: np.ndarray,
    earth_visible: np.ndarray,
) -> list[dict]:
    """Per UTC day: hours of Sun, hours of Earth, highest Sun, longest Sun gap touching that day.

    The gap is the whole dark spell, not just the part inside the day, so it can be longer than
    24 hours. Spells are measured inside the data, so one that touches the first or last hour is
    cut there.
    """
    per_day = int(24 * 60 / step_minutes)
    hours = step_minutes / 60.0
    dark = dark_run_lengths(sun_visible.astype(bool))
    days = []
    for d in range(len(sun_elev) // per_day):
        s = slice(d * per_day, (d + 1) * per_day)
        days.append(
            {
                "date": (start + timedelta(days=d)).strftime("%Y-%m-%d"),
                "sun_hours": round(float(sun_visible[s].sum()) * hours, 2),
                "earth_hours": round(float(earth_visible[s].sum()) * hours, 2),
                "max_sun_elev_deg": round(float(sun_elev[s].max()), 3),
                "longest_sun_gap_hours": round(float(dark[s].max()) * hours, 2),
            }
        )
    return days


def build_site(
    site: dict,
    dem_path: str,
    start: datetime,
    days: int,
    step_minutes: int,
    earth_distance_km: np.ndarray,
    far_dem_path: str | None = None,
) -> tuple[dict, dict]:
    count = days * 24 * 60 // step_minutes
    horizon: Horizon = terrain.site_horizon(
        dem_path, site["lat"], site["lon"], max_range_m=MAX_RANGE_M, far_dem_path=far_dem_path, far_range_m=FAR_RANGE_M
    )
    sun = horizons.fetch_series(horizons.SUN, site["lon"], site["lat"], start, count, step_minutes)
    earth = horizons.fetch_series(horizons.EARTH, site["lon"], site["lat"], start, count, step_minutes)

    sun_az = np.array([s.az_deg for s in sun])
    sun_el = np.array([s.elev_deg for s in sun])
    earth_az = np.array([s.az_deg for s in earth])
    earth_el = np.array([s.elev_deg for s in earth])
    # A body is visible when any part of its disc is above the terrain horizon.
    sun_vis = disc_visible_mask(horizon, sun_az, sun_el, sun_angular_radius_deg())
    earth_vis = disc_visible_mask(horizon, earth_az, earth_el, earth_angular_radius_deg(earth_distance_km))

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
    p.add_argument("--out", default=str(here.parent / "public/data"))
    p.add_argument("--start", default="2027-01-01", help="UTC date, YYYY-MM-DD")
    p.add_argument("--days", type=int, default=365)
    p.add_argument("--step-minutes", type=int, default=60)
    p.add_argument("--only", help="build just this site id")
    args = p.parse_args()

    start = datetime.strptime(args.start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    sites = json.loads(Path(args.sites).read_text())
    out = Path(args.out)
    write_json(out / "sites.json", sites)
    count = args.days * 24 * 60 // args.step_minutes
    eph = ephemeris.build_ephemeris(start, count, args.step_minutes)  # also gives Earth's size
    if not args.only:
        write_json(out / "ephemeris.json", eph)
    earth_distance_km = np.array(eph["earth_distance_km"], dtype=float)
    for site in sites:
        if args.only and site["id"] != args.only:
            continue
        dem = pick_dem(site["lat"], site["lon"], args.dem5, args.dem30)
        print(f"{site['id']}: {Path(dem).name}", flush=True)
        series, summary = build_site(
            site, dem, start, args.days, args.step_minutes, earth_distance_km, far_dem_path=args.dem30
        )
        write_json(out / "sites" / f"{site['id']}.json", series)
        write_json(out / "summary" / f"{site['id']}.json", summary)


if __name__ == "__main__":
    main()
