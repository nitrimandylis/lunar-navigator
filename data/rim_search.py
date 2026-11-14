"""Find well-lit points near a crater, and lit/dark pairs a few km apart, by scanning terrain.

The Sun and Earth are so far away that their direction in the sky barely changes between
points a few tens of km apart. So one Horizons series (from a reference site) is turned into
direction vectors once, and re-expressed as azimuth/elevation at every candidate point.
Only the terrain horizon is computed per point.

Scanning uses a quick 15 km horizon. Distant terrain can only block more sky, never less,
so the best few points are then re-scored with the full 150 km horizon.

Run order: the reference series is an hourly site file written by build.py. The default is
public/data/sites/shackleton-ridge.json, which is committed, so it is there on a fresh clone.
If it is missing or you changed the site list, run build.py first, or pass --reference with
any hourly site file plus that site's --reference-lat and --reference-lon.

    python data/rim_search.py --dem30 <30 m DEM> --out x.json craters
    python data/rim_search.py --dem30 <30 m DEM> --out x.json pair --center-lat -89.67 --center-lon 129.78
"""

from __future__ import annotations

import argparse
import json
import math
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np

import terrain
from horizon_mask import visible_mask

SCAN_RANGE_M = 15_000.0  # quick horizon used to scan many points
FINAL_RANGE_M = 25_000.0  # full-detail range for the final score
FAR_RANGE_M = 150_000.0
RESCORE_TOP = 25


def _basis(lat_deg: float, lon_deg: float):
    """Local east, north, up unit vectors (in the Moon-fixed frame) at a point."""
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    up = np.array([math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat)])
    east = np.array([-math.sin(lon), math.cos(lon), 0.0])
    north = np.array([-math.sin(lat) * math.cos(lon), -math.sin(lat) * math.sin(lon), math.cos(lat)])
    return east, north, up


def to_vectors(az_deg: np.ndarray, elev_deg: np.ndarray, lat_deg: float, lon_deg: float) -> np.ndarray:
    """Direction to a body, from (az, elev) at a point, as unit vectors (n, 3)."""
    east, north, up = _basis(lat_deg, lon_deg)
    az, el = np.radians(az_deg), np.radians(elev_deg)
    return (
        np.outer(np.sin(az) * np.cos(el), east)
        + np.outer(np.cos(az) * np.cos(el), north)
        + np.outer(np.sin(el), up)
    )


def from_vectors(vectors: np.ndarray, lat_deg: float, lon_deg: float) -> tuple[np.ndarray, np.ndarray]:
    """(az, elev) in degrees of those directions as seen from another point."""
    east, north, up = _basis(lat_deg, lon_deg)
    el = np.degrees(np.arcsin(np.clip(vectors @ up, -1.0, 1.0)))
    az = np.degrees(np.arctan2(vectors @ east, vectors @ north)) % 360.0
    return az, el


def candidate_points(cx: float, cy: float, radius_m: float, spacing_m: float) -> list[tuple[float, float]]:
    """Grid of projection points (x, y) inside a circle."""
    n = int(radius_m // spacing_m)
    offsets = np.arange(-n, n + 1) * spacing_m
    return [
        (cx + dx, cy + dy)
        for dx in offsets
        for dy in offsets
        if math.hypot(dx, dy) <= radius_m
    ]


# --- scoring one point ---------------------------------------------------------------

_CTX: dict = {}


def _init(dem, far_dem, sun_vec, earth_vec):
    _CTX.update(dem=dem, far_dem=far_dem, sun_vec=sun_vec, earth_vec=earth_vec)


def score_point(x: float, y: float, far: bool = False, ctx: dict | None = None):
    """Hours of Sun and Earth at a projection point, or None if the terrain can't be read.

    With far=True the horizon includes terrain out to 150 km and uses full detail to 25 km.
    """
    c = ctx or _CTX
    lat, lon = terrain.xy_to_lonlat(x, y)
    try:
        h = terrain.site_horizon(
            c["dem"],
            lat,
            lon,
            max_range_m=FINAL_RANGE_M if far else SCAN_RANGE_M,
            az_step_deg=1.0 if far else 2.0,
            far_dem_path=c["far_dem"] if far else None,
            far_range_m=FAR_RANGE_M,
        )
    except ValueError:
        return None
    sun_az, sun_el = from_vectors(c["sun_vec"], lat, lon)
    earth_az, earth_el = from_vectors(c["earth_vec"], lat, lon)
    sun = visible_mask(h, sun_az, sun_el)
    earth = visible_mask(h, earth_az, earth_el)
    return {
        "x": x,
        "y": y,
        "lat": lat,
        "lon": lon,
        "sun_hours": float(sun.sum()),
        "earth_hours": float(earth.sum()),
        "both_hours": float((sun & earth).sum()),
    }


def _job(job):
    x, y, far = job
    return score_point(x, y, far)


def _score_many(pool, points, far=False):
    jobs = [(x, y, far) for x, y in points]
    return [s for s in pool.map(_job, jobs, chunksize=8) if s is not None]


def _total(s):
    return s["sun_hours"] + s["earth_hours"]


# --- search modes --------------------------------------------------------------------


def search_crater(pool, center_lat, center_lon, radius_m, grid=16, rounds=2):
    """Coarse grid, zoom in twice on the best point, then re-score the best few with the far horizon."""
    cx, cy = terrain.lonlat_to_xy(center_lat, center_lon)
    spacing = 2.0 * radius_m / grid
    bx, by, r = cx, cy, radius_m
    scored: list[dict] = []
    for _ in range(rounds + 1):
        scored += _score_many(pool, candidate_points(bx, by, r, spacing))
        if not scored:
            raise ValueError("no readable terrain around this crater")
        best = max(scored, key=_total)
        bx, by = best["x"], best["y"]
        r = spacing
        spacing = 2.0 * r / grid
    top = sorted(scored, key=_total, reverse=True)[:RESCORE_TOP]
    final = _score_many(pool, [(s["x"], s["y"]) for s in top], far=True)
    return max(final, key=_total)


def search_pair(pool, center_lat, center_lon, radius_m, spacing_m=700.0, min_sep_m=2_000.0, max_sep_m=6_000.0):
    """A well-lit point and a nearly dark point a few km apart. Returns (lit, dark, separation_m)."""
    cx, cy = terrain.lonlat_to_xy(center_lat, center_lon)
    grid = _score_many(pool, candidate_points(cx, cy, radius_m, spacing_m))
    lit_pool = sorted(grid, key=lambda s: s["sun_hours"], reverse=True)[:RESCORE_TOP]
    lit_true = _score_many(pool, [(s["x"], s["y"]) for s in lit_pool], far=True)
    dark = [s for s in grid if s["sun_hours"] <= 100]  # scan score is an upper bound on Sun hours
    best = None
    for lit in lit_true:
        for d in dark:
            sep = math.hypot(lit["x"] - d["x"], lit["y"] - d["y"])
            if min_sep_m <= sep <= max_sep_m:
                key = (lit["sun_hours"], -sep)
                if best is None or key > best[0]:
                    best = (key, lit, d, sep)
    if best is None:
        raise ValueError("no lit/dark pair found in that range")
    _, lit, dark_pt, sep = best
    dark_true = _score_many(pool, [(dark_pt["x"], dark_pt["y"])], far=True)[0]
    return lit, dark_true, sep


# Crater centres (IAU Gazetteer of Planetary Nomenclature, via Wikipedia) and how far from each
# centre to look, in metres (our own choice of search area): name -> (lat, lon, radius_m).
CRATERS = {
    "shackleton": (-89.67, 129.78, 12_000),
    "de-gerlache": (-88.5, -87.1, 20_000),
    "haworth": (-86.9, -4.0, 30_000),
    "faustini": (-87.3, 77.0, 25_000),
    "malapert": (-84.9, 12.9, 40_000),
    "nobile": (-85.28, 53.27, 40_000),
    "amundsen": (-84.5, 82.8, 60_000),
    "cabeus": (-84.9, -35.5, 30_000),
    "kocher": (-84.47, -134.02, 15_000),
    "sverdrup": (-88.5, -152.0, 15_000),
    "slater": (-88.08, 111.29, 12_000),
}


def _load_vectors(reference: str, lat: float, lon: float):
    ref = json.loads(Path(reference).read_text())
    sun = to_vectors(np.array(ref["sun_az_deg"]), np.array(ref["sun_elev_deg"]), lat, lon)
    earth = to_vectors(np.array(ref["earth_az_deg"]), np.array(ref["earth_elev_deg"]), lat, lon)
    return sun, earth


def _round(d):
    return {k: (round(v, 4) if isinstance(v, float) else v) for k, v in d.items() if k not in ("x", "y")}


def main() -> None:
    here = Path(__file__).parent
    p = argparse.ArgumentParser()
    p.add_argument("--dem30", required=True)
    p.add_argument("--reference", default=str(here.parent / "public/data/sites/shackleton-ridge.json"))
    p.add_argument("--reference-lat", type=float, default=-89.3277)
    p.add_argument("--reference-lon", type=float, default=116.8355)
    p.add_argument("--out", required=True)
    p.add_argument("--workers", type=int, default=6)
    sub = p.add_subparsers(dest="mode", required=True)
    c = sub.add_parser("craters")
    c.add_argument("--only")
    q = sub.add_parser("pair")
    q.add_argument("--center-lat", type=float, required=True)
    q.add_argument("--center-lon", type=float, required=True)
    q.add_argument("--radius-m", type=float, default=14_000)
    args = p.parse_args()

    sun_vec, earth_vec = _load_vectors(args.reference, args.reference_lat, args.reference_lon)
    with ProcessPoolExecutor(args.workers, initializer=_init, initargs=(args.dem30, args.dem30, sun_vec, earth_vec)) as pool:
        if args.mode == "pair":
            lit, dark, sep = search_pair(pool, args.center_lat, args.center_lon, args.radius_m)
            result = {"lit": _round(lit), "dark": _round(dark), "separation_m": round(sep)}
        else:
            result = []
            for name, (lat, lon, radius) in CRATERS.items():
                if args.only and name != args.only:
                    continue
                best = search_crater(pool, lat, lon, radius)
                result.append({"crater": name, **_round(best)})
                print(result[-1], flush=True)
    Path(args.out).write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
