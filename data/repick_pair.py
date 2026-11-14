r"""Re-pick the Shackleton lit/dark pair: scan, then refine both points on a 50 m grid.

Reproducible version of the scripts that picked shackleton-ridge and shackleton-shadow at the
2 m observer height. It reuses rim_search.py and terrain.py:

1. Coarse scan of a small area around the ridge (default: 3 km around -89.43, 222.5). The
   committed ridge is about 20 km from the Shackleton centre (-89.67, 129.78), so scanning
   from the centre fills rim_search's top-25 shortlist with Shackleton rim points and misses it.
2. Re-score the best 25 coarse points on the 5 m DEM with the 150 km horizon, then refine the
   best one on a 50 m grid (best Sun hours first, then Earth hours).
3. Dark partner: scan a ring 2 to 6 km around the lit point, rank by fewest Sun hours, then
   fewest Earth hours (0/0 preferred), then the shortest gap; re-score the best 25 on the 5 m
   DEM, refine on a 50 m grid around the best, keeping the separation in range.
4. Write the result as JSON. numpy numbers are turned into plain Python ones first
   (json.dumps cannot write numpy int64, which is what crashed the earlier script).

The Sun and Earth directions come from one hourly site file (see rim_search.py), so no
internet is needed when the committed public/data/sites/shackleton-ridge.json is used.

Command used (2 workers each, from the repo root; DEM paths are this machine's):

    python data/repick_pair.py --dem5 LRO_LOLA_DEM_SPole875_5mp_v04.tif \
        --dem30 LRO_LOLA_DEM_SPole75_30mp_v04.tif --out pair.json \
        --center-lat -89.43 --center-lon 222.5 --radius-m 3000 \
        --workers 2 --fine-workers 2 --rescore-top 100 --refine-radius-m 1500

It prints the pair and writes only --out: sites.json is edited by hand.
"""

from __future__ import annotations

import argparse
import json
import math
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
import rasterio

import rim_search as rs
import terrain

CENTER_LAT, CENTER_LON = -89.43, 222.5  # near the committed ridge (about 20 km from the Shackleton centre)
SEARCH_RADIUS_M = 3_000.0
COARSE_SPACING_M = 350.0  # 700 m missed the narrow lit ridge
MIN_SEP_M, MAX_SEP_M = 2_000.0, 6_000.0
REFINE_SPACING_M = 50.0
REFINE_RADIUS_M = 1_500.0  # 350 m (one coarse cell) settled on a point 1 km from the committed ridge


# --- pure helpers (tested with synthetic data) ---------------------------------------


def to_python(value):
    """Plain Python version of `value`, safe for json.dumps (numpy ints, floats, bools, arrays)."""
    if isinstance(value, dict):
        return {str(k): to_python(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_python(v) for v in value]
    if isinstance(value, np.ndarray):
        return to_python(value.tolist())
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    return value


def separation_m(a: dict, b: dict) -> float:
    """Distance between two scored points in projection metres."""
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def lit_key(s: dict):
    """Sort key for the lit point: most Sun, then most Earth."""
    return (s["sun_hours"], s["earth_hours"])


def dark_key(s: dict, sep_m: float):
    """Sort key for the dark partner (bigger is better): least Sun, least Earth, shortest gap."""
    return (-s["sun_hours"], -s["earth_hours"], -sep_m)


def best_lit(scored: list[dict]) -> dict:
    if not scored:
        raise ValueError("no scored points")
    return max(scored, key=lit_key)


def dark_candidates(scored: list[dict], lit: dict, min_sep_m: float, max_sep_m: float) -> list[tuple[dict, float]]:
    """(point, separation) for points within range of `lit`, best dark partner first."""
    out = []
    for s in scored:
        sep = separation_m(lit, s)
        if min_sep_m <= sep <= max_sep_m:
            out.append((s, sep))
    return sorted(out, key=lambda t: dark_key(*t), reverse=True)


def best_dark(scored: list[dict], lit: dict, min_sep_m: float, max_sep_m: float) -> tuple[dict, float]:
    cands = dark_candidates(scored, lit, min_sep_m, max_sep_m)
    if not cands:
        raise ValueError("no dark partner in range of the lit point")
    return cands[0]


def describe(s: dict, elevation_m: float | None = None) -> dict:
    """Rounded, JSON-safe summary of a scored point (x and y are dropped)."""
    out = {k: (round(v, 5) if k in ("lat", "lon") else v) for k, v in to_python(s).items() if k not in ("x", "y")}
    for k in ("sun_hours", "earth_hours", "both_hours"):
        out[k] = round(out[k], 1)
    if elevation_m is not None:
        out["elevation_m"] = round(float(elevation_m))
    return out


# --- running it ----------------------------------------------------------------------


def _refine_grid(pool, cx, cy, radius_m):
    return rs._score_many(pool, rs.candidate_points(cx, cy, radius_m, REFINE_SPACING_M))


def elevation_at(dem_path: str, x: float, y: float) -> float:
    with rasterio.open(dem_path) as dem:
        return float(next(dem.sample([(x, y)]))[0])


def _top_far(scan_pool, fine_pool, points, key, n=rs.RESCORE_TOP):
    """Quick-scored points -> best RESCORE_TOP by `key` -> re-scored on the 5 m DEM with the far horizon."""
    top = sorted(points, key=key, reverse=True)[:n]
    return rs._score_many(fine_pool, [(s["x"], s["y"]) for s in top], far=True)


def repick(scan_pool, fine_pool, dem5, args):
    # 1. coarse lit scan around the ridge, shortlist re-scored with the far horizon
    cx, cy = terrain.lonlat_to_xy(args.center_lat, args.center_lon)
    grid = rs._score_many(scan_pool, rs.candidate_points(cx, cy, args.radius_m, args.coarse_spacing_m))
    if not grid:
        raise ValueError("no readable terrain around the centre")
    lit0 = best_lit(_top_far(scan_pool, fine_pool, grid, lit_key, args.rescore_top))
    print(f"coarse lit {lit0['lat']:.5f},{lit0['lon']:.5f} sun {lit0['sun_hours']:.0f} h", flush=True)

    # 2. refine lit on a 50 m grid
    grid = _refine_grid(scan_pool, lit0["x"], lit0["y"], args.refine_radius_m)
    lit = best_lit(_top_far(scan_pool, fine_pool, grid, lit_key, args.rescore_top))

    # 3. dark partner: ring scan around the lit point, then a 50 m refinement around the best
    ring = rs._score_many(scan_pool, rs.candidate_points(lit["x"], lit["y"], args.max_sep_m, args.coarse_spacing_m))
    cands = dark_candidates(ring, lit, args.min_sep_m, args.max_sep_m)
    top = [s for s, _ in cands[: rs.RESCORE_TOP]]
    dark0, sep0 = best_dark(rs._score_many(fine_pool, [(s["x"], s["y"]) for s in top], far=True), lit, args.min_sep_m, args.max_sep_m)
    print(f"coarse dark {dark0['lat']:.5f},{dark0['lon']:.5f} sun {dark0['sun_hours']:.0f} earth {dark0['earth_hours']:.0f} sep {sep0:.0f} m", flush=True)
    grid = _refine_grid(scan_pool, dark0["x"], dark0["y"], args.refine_radius_m)
    cands = dark_candidates(grid, lit, args.min_sep_m, args.max_sep_m)[: rs.RESCORE_TOP]
    final = rs._score_many(fine_pool, [(s["x"], s["y"]) for s, _ in cands], far=True)
    dark, sep = best_dark(final + [dark0], lit, args.min_sep_m, args.max_sep_m)

    return {
        "lit": describe(lit, elevation_at(dem5, lit["x"], lit["y"])),
        "dark": describe(dark, elevation_at(dem5, dark["x"], dark["y"])),
        "separation_m": round(sep),
        "coarse": {"lit": describe(lit0), "dark": describe(dark0), "separation_m": round(sep0)},
        "refine_spacing_m": REFINE_SPACING_M,
        "observer_height_m": terrain.DEFAULT_OBSERVER_HEIGHT_M,
    }


def main() -> None:
    here = Path(__file__).parent
    p = argparse.ArgumentParser()
    p.add_argument("--dem5", required=True)
    p.add_argument("--dem30", required=True)
    p.add_argument("--reference", default=str(here.parent / "public/data/sites/shackleton-ridge.json"))
    p.add_argument("--reference-lat", type=float, default=-89.3277)
    p.add_argument("--reference-lon", type=float, default=116.8355)
    p.add_argument("--out", required=True)
    p.add_argument("--workers", type=int, default=2, help="for the 30 m scan")
    p.add_argument("--fine-workers", type=int, default=2, help="for the 5 m DEM (about 1 GB each)")
    p.add_argument("--center-lat", type=float, default=CENTER_LAT)
    p.add_argument("--center-lon", type=float, default=CENTER_LON)
    p.add_argument("--radius-m", type=float, default=SEARCH_RADIUS_M)
    p.add_argument("--min-sep-m", type=float, default=MIN_SEP_M)
    p.add_argument("--max-sep-m", type=float, default=MAX_SEP_M)
    p.add_argument("--coarse-spacing-m", type=float, default=COARSE_SPACING_M)
    p.add_argument("--rescore-top", type=int, default=100, help="lit points re-scored on the 5 m DEM")
    p.add_argument("--refine-radius-m", type=float, default=REFINE_RADIUS_M)
    args = p.parse_args()

    sun_vec, earth_vec = rs._load_vectors(args.reference, args.reference_lat, args.reference_lon)
    with ProcessPoolExecutor(
        args.workers, initializer=rs._init, initargs=(args.dem30, args.dem30, sun_vec, earth_vec)
    ) as scan_pool, ProcessPoolExecutor(
        args.fine_workers, initializer=rs._init, initargs=(args.dem5, args.dem30, sun_vec, earth_vec)
    ) as fine_pool:
        result = repick(scan_pool, fine_pool, args.dem5, args)
    text = json.dumps(to_python(result), indent=2) + "\n"
    Path(args.out).write_text(text)
    print(text)


if __name__ == "__main__":
    main()
