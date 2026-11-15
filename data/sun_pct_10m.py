"""Percent of all hours of 2027-2030 with any part of the Sun disc above the horizon, for an
observer standing 10 m above the ground (field `sun_pct_10m` in sites.json).

    python data/sun_pct_10m.py --validate          # 2 m, 2027: must match the committed sun_visible
    python data/sun_pct_10m.py --write             # compute at 10 m and update both sites.json files

It reuses build.py's rules exactly: same DEM choice (5 m near the pole, else 30 m), same 25 km /
150 km ranges, a 360-value horizon (1 degree steps, nearest-azimuth lookup, no refraction), and
horizon_mask.disc_visible_mask with the solar disc radius. Only the observer height changes. The
Sun az/el are read from the committed hourly files (they do not depend on the observer height).
No internet needed; needs the two DEM files.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

import terrain
from build import MAX_RANGE_M, FAR_RANGE_M, pick_dem, write_json
from horizon_mask import Horizon, disc_visible_mask, sun_angular_radius_deg

HERE = Path(__file__).parent
PUBLIC = HERE.parent / "public" / "data"
YEARS = [2027, 2028, 2029, 2030]
OBSERVER_HEIGHT_M = 10.0
FIELD = "sun_pct_10m"


def hourly_path(year: int, site_id: str, public: Path = PUBLIC) -> Path:
    base = public if year == 2027 else public / str(year)
    return base / "sites" / f"{site_id}.json"


def load_sun(year: int, site_id: str, public: Path = PUBLIC) -> dict:
    return json.loads(hourly_path(year, site_id, public).read_text(encoding="utf-8"))


def visible_hours(horizon: Horizon, sun_az: np.ndarray, sun_el: np.ndarray) -> np.ndarray:
    """Boolean per hour: any part of the Sun's disc above the horizon (same rule as build.py)."""
    return disc_visible_mask(horizon, np.asarray(sun_az), np.asarray(sun_el), sun_angular_radius_deg())


def percent(visible: np.ndarray) -> float:
    """Percent of samples that are True, rounded to 1 decimal."""
    return round(100.0 * float(np.count_nonzero(visible)) / len(visible), 1)


def site_horizon_at(site: dict, height_m: float, dem5: str, dem30: str) -> Horizon:
    dem = pick_dem(site["lat"], site["lon"], dem5, dem30)
    return terrain.site_horizon(
        dem,
        site["lat"],
        site["lon"],
        max_range_m=MAX_RANGE_M,
        observer_height_m=height_m,
        far_dem_path=dem30,
        far_range_m=FAR_RANGE_M,
    )


def site_percent(horizon: Horizon, site_id: str, years=YEARS, public: Path = PUBLIC) -> tuple[float, int, int]:
    """(percent rounded to 1 decimal, visible hours, total hours) over the given years."""
    vis = np.concatenate(
        [visible_hours(horizon, d["sun_az_deg"], d["sun_elev_deg"]) for d in (load_sun(y, site_id, public) for y in years)]
    )
    return percent(vis), int(vis.sum()), len(vis)


def committed_percent(site_id: str, years=YEARS, public: Path = PUBLIC) -> float:
    vis = np.concatenate([np.array(load_sun(y, site_id, public)["sun_visible"], dtype=bool) for y in years])
    return percent(vis)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dem5", default=str(HERE / "raw/LRO_LOLA_DEM_SPole875_5mp_v04.tif"))
    p.add_argument("--dem30", default=str(HERE / "raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif"))
    p.add_argument("--validate", action="store_true", help="recompute 2 m visibility and compare with the committed files")
    p.add_argument("--write", action="store_true", help="add sun_pct_10m to data/sites.json and public/data/sites.json")
    p.add_argument("--only", help="one site id")
    args = p.parse_args()

    src = HERE / "sites.json"
    sites = json.loads(src.read_text(encoding="utf-8"))
    todo = [s for s in sites if not args.only or s["id"] == args.only]

    if args.validate:
        bad = 0
        for s in todo:
            h2 = site_horizon_at(s, terrain.DEFAULT_OBSERVER_HEIGHT_M, args.dem5, args.dem30)
            committed_h = json.loads(hourly_path(2027, s["id"]).read_text(encoding="utf-8"))["horizon"]["elev_deg"]
            hmax = float(np.max(np.abs(np.round(h2.elev_deg, 3) - np.array(committed_h))))
            for y in YEARS:
                d = load_sun(y, s["id"])
                mine = visible_hours(h2, d["sun_az_deg"], d["sun_elev_deg"]).astype(int)
                diff = int((mine != np.array(d["sun_visible"])).sum())
                bad += diff
                print(f"{s['id']} {y}: horizon max diff {hmax:.4f} deg, sun_visible mismatches {diff}/{len(mine)}", flush=True)
        print("TOTAL MISMATCHES", bad)
        return

    results = {}
    for s in todo:
        h2 = site_horizon_at(s, terrain.DEFAULT_OBSERVER_HEIGHT_M, args.dem5, args.dem30)
        h10 = site_horizon_at(s, OBSERVER_HEIGHT_M, args.dem5, args.dem30)
        p2 = site_percent(h2, s["id"])[0]
        p10, n, total = site_percent(h10, s["id"])
        results[s["id"]] = p10
        print(f"{s['id']}\t2m {p2}\t(committed {committed_percent(s['id'])})\t10m {p10}\t{n}/{total}", flush=True)

    if args.write:
        for s in sites:
            if s["id"] in results:
                s[FIELD] = results[s["id"]]
        src.write_text(json.dumps(sites, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        write_json(PUBLIC / "sites.json", sites)


if __name__ == "__main__":
    main()
