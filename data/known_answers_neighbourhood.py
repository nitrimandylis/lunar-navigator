"""Glaser 2014 comparison, taking the MAX Sun % over a neighbourhood of the published point.

Glaser et al. report maxima on a 20 m grid, so a single 5 m pixel at their coordinates may sit
on a worse pixel than the one they report. This computes our 2027 Sun % (any part of the disc
above the horizon, hourly, same rule and observer height as data/KNOWN-ANSWERS.md) at every 5 m
DEM pixel centre inside a neighbourhood of each spot and reports the maximum, the mean and
where the maximum sits.

    python data/known_answers_neighbourhood.py --dem5 <5 m tif> --dem30 <30 m tif> [--out file.json]

Needs internet once per spot (JPL Horizons Sun series, fetched at the published point and
reused for the neighbours: the Sun direction changes by under 0.001 degrees over 40 m).
Every neighbour gets its own full horizon (terrain.site_horizon, same ranges as build.py).
"""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import rasterio

import build
import horizons
import terrain
from horizon_mask import disc_visible_mask, sun_angular_radius_deg

SPOTS = Path(__file__).with_name("known_answers_glaser_spots.json")
PUBLISHED = {  # Glaser 2014 percent lit, from data/KNOWN-ANSWERS.md
    "glaser-spot-1": 92.0,
    "glaser-spot-2": 92.3,
    "glaser-spot-3": 95.6,
    "glaser-spot-4": 95.66,
}
# name -> (shape, half-size in metres). disc: pixel centres within that radius of the point;
# square: pixel centres with |dx| and |dy| both within that half-width of the point.
VARIANTS = {
    "disc 20 m diameter (r 10 m)": ("disc", 10.0),
    "square 20 m x 20 m": ("square", 10.0),
    "disc 40 m diameter (r 20 m)": ("disc", 20.0),
    "square 40 m x 40 m": ("square", 20.0),
}


def neighbourhood_offsets(
    point_x: float, point_y: float, origin_x: float, origin_y: float, pixel_m: float, shape: str, half_m: float
) -> list[tuple[int, int]]:
    """Pixel offsets (d_col, d_row) from the pixel holding the point whose centres lie in the area.

    (origin_x, origin_y) is the centre of any pixel (the grid is origin + k * pixel_m, with y up the
    image so a larger row is a smaller y). Distances are measured from the point itself, not from
    its pixel centre. Returned offsets are in image order: d_col east, d_row south.
    """
    c0 = round((point_x - origin_x) / pixel_m)
    r0 = round((origin_y - point_y) / pixel_m)  # row index grows as y decreases
    k = int(math.ceil(half_m / pixel_m)) + 1
    out = []
    for dr in range(-k, k + 1):
        for dc in range(-k, k + 1):
            cx = origin_x + (c0 + dc) * pixel_m
            cy = origin_y - (r0 + dr) * pixel_m
            dx, dy = cx - point_x, cy - point_y
            inside = math.hypot(dx, dy) <= half_m if shape == "disc" else max(abs(dx), abs(dy)) <= half_m
            if inside:
                out.append((dc, dr))
    return out


def summarise(percents: list[float], centres: list[tuple[float, float]], point: tuple[float, float]) -> dict:
    """Max, mean, min and where the max sits (metres east/north of the point, projection metres)."""
    i = int(np.argmax(percents))
    return {
        "pixels": len(percents),
        "max": round(max(percents), 2),
        "mean": round(float(np.mean(percents)), 2),
        "min": round(min(percents), 2),
        "max_at_east_m": round(centres[i][0] - point[0], 1),
        "max_at_north_m": round(centres[i][1] - point[1], 1),
    }


def sun_percent(horizon, az, el, radius) -> float:
    return 100.0 * float(disc_visible_mask(horizon, az, el, radius).sum()) / len(az)


def run(dem5: str, dem30: str, only: str | None = None) -> list[dict]:
    start = datetime(2027, 1, 1, tzinfo=timezone.utc)
    spots = json.loads(SPOTS.read_text())
    with rasterio.open(dem5) as d:
        pixel_m = d.res[0]
        ox = d.transform.c + 0.5 * pixel_m  # centre of pixel (0, 0)
        oy = d.transform.f - 0.5 * pixel_m
    radius = sun_angular_radius_deg()
    results = []
    for spot in spots:
        if only and spot["id"] != only:
            continue
        lat, lon, h = spot["lat"], spot["lon"], spot["observer_height_m"]
        sun = horizons.fetch_series(horizons.SUN, lon, lat, start, 8760, 60)
        az = np.array([s.az_deg for s in sun])
        el = np.array([s.elev_deg for s in sun])
        print(f"{spot['id']}: Sun series fetched", flush=True)
        px, py = terrain.lonlat_to_xy(lat, lon)
        cache: dict[tuple[int, int], tuple[float, float, float]] = {}

        def pixel_result(dc: int, dr: int) -> tuple[float, float, float]:
            if (dc, dr) not in cache:
                c0 = round((px - ox) / pixel_m)
                r0 = round((oy - py) / pixel_m)
                cx, cy = ox + (c0 + dc) * pixel_m, oy - (r0 + dr) * pixel_m
                plat, plon = terrain.xy_to_lonlat(cx, cy)
                hor = terrain.site_horizon(
                    dem5, plat, plon, max_range_m=build.MAX_RANGE_M, observer_height_m=h,
                    far_dem_path=dem30, far_range_m=build.FAR_RANGE_M,
                )
                cache[(dc, dr)] = (cx, cy, sun_percent(hor, az, el, radius))
                print(f"  {spot['id']} pixel {len(cache)} done", flush=True)
            return cache[(dc, dr)]

        # The exact published point, as in the committed file (sanity check, not a pixel centre).
        hor = terrain.site_horizon(
            dem5, lat, lon, max_range_m=build.MAX_RANGE_M, observer_height_m=h,
            far_dem_path=dem30, far_range_m=build.FAR_RANGE_M,
        )
        row = {
            "id": spot["id"], "lat": lat, "lon": lon, "observer_height_m": h,
            "published": PUBLISHED[spot["id"]],
            "committed_point_percent": spot["sun_percent"],
            "recomputed_point_percent": round(sun_percent(hor, az, el, radius), 2),
            "variants": {},
        }
        for name, (shape, half) in VARIANTS.items():
            offs = neighbourhood_offsets(px, py, ox, oy, pixel_m, shape, half)
            res = [pixel_result(dc, dr) for dc, dr in offs]
            row["variants"][name] = summarise([r[2] for r in res], [(r[0], r[1]) for r in res], (px, py))
        results.append(row)
        print(json.dumps(row), flush=True)
    return results


def main() -> None:
    here = Path(__file__).parent
    p = argparse.ArgumentParser()
    p.add_argument("--dem5", default=str(here / "raw/LRO_LOLA_DEM_SPole875_5mp_v04.tif"))
    p.add_argument("--dem30", default=str(here / "raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif"))
    p.add_argument("--only", help="one spot id")
    p.add_argument("--out", help="write the results as JSON here")
    args = p.parse_args()
    results = run(args.dem5, args.dem30, args.only)
    if args.out:
        Path(args.out).write_text(json.dumps(results, indent=1) + "\n")


if __name__ == "__main__":
    main()
