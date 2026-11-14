"""Find well-lit rim and ridge points near a crater by scanning the terrain.

The Sun and Earth are so far away that their direction in the sky barely changes between
points a few tens of km apart. So one Horizons series (from a reference site) is turned into
direction vectors once, and re-expressed as azimuth/elevation at every candidate point.
Only the terrain horizon is computed per point.

    python data/rim_search.py --dem30 <30 m DEM> --reference data/out/sites/shackleton.json
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np

import terrain
from horizon_mask import visible_mask

MAX_RANGE_M = 15_000.0  # screening only; build.py re-checks the winners at 25 km


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


def score_point(dem: str, x: float, y: float, sun_vec: np.ndarray, earth_vec: np.ndarray, step_hours: float = 1.0):
    """Hours of Sun and Earth at a projection point, or None if the terrain can't be read."""
    lat, lon = terrain.xy_to_lonlat(x, y)
    try:
        h = terrain.horizon_at_xy(
            dem, x, y, north_deg=lon, ground_scale=terrain.scale_factor(lat), max_range_m=MAX_RANGE_M, az_step_deg=2.0
        )
    except ValueError:
        return None
    sun_az, sun_el = from_vectors(sun_vec, lat, lon)
    earth_az, earth_el = from_vectors(earth_vec, lat, lon)
    sun = visible_mask(h, sun_az, sun_el)
    earth = visible_mask(h, earth_az, earth_el)
    return {
        "lat": lat,
        "lon": lon,
        "sun_hours": float(sun.sum()) * step_hours,
        "earth_hours": float(earth.sum()) * step_hours,
        "both_hours": float((sun & earth).sum()) * step_hours,
    }


def search(dem, center_lat, center_lon, radius_m, sun_vec, earth_vec, grid=16, rounds=2):
    """Coarse grid, then repeatedly zoom in on the best point. Best = most Sun plus Earth hours."""
    cx, cy = terrain.lonlat_to_xy(center_lat, center_lon)
    spacing = 2.0 * radius_m / grid
    best, bx, by, r = None, cx, cy, radius_m
    for round_no in range(rounds + 1):
        for x, y in candidate_points(bx, by, r, spacing):
            s = score_point(dem, x, y, sun_vec, earth_vec)
            if s is None:
                continue
            if best is None or s["sun_hours"] + s["earth_hours"] > best["sun_hours"] + best["earth_hours"]:
                best, best_xy = s, (x, y)
        if best is None:
            raise ValueError("no readable terrain around this crater")
        bx, by = best_xy
        r = spacing  # zoom: search one old cell around the best point
        spacing = 2.0 * r / grid
    return best


# Search areas (our own choice of how far from each crater centre to look, in metres).
SEARCH_RADIUS_M = {
    "shackleton": 12_000,
    "de-gerlache": 20_000,
    "haworth": 30_000,
    "faustini": 25_000,
    "malapert": 40_000,
    "nobile": 40_000,
    "amundsen": 60_000,
}


def main() -> None:
    here = Path(__file__).parent
    p = argparse.ArgumentParser()
    p.add_argument("--dem30", required=True)
    p.add_argument("--reference", default=str(here / "out/sites/shackleton.json"))
    p.add_argument("--reference-lat", type=float, default=-89.67)
    p.add_argument("--reference-lon", type=float, default=129.78)
    p.add_argument("--sites", default=str(here / "sites.json"))
    p.add_argument("--only", help="search just this crater id")
    p.add_argument("--out", default=str(here / "rim_candidates.json"))
    args = p.parse_args()

    ref = json.loads(Path(args.reference).read_text())
    sun_vec = to_vectors(np.array(ref["sun_az_deg"]), np.array(ref["sun_elev_deg"]), args.reference_lat, args.reference_lon)
    earth_vec = to_vectors(np.array(ref["earth_az_deg"]), np.array(ref["earth_elev_deg"]), args.reference_lat, args.reference_lon)

    results = []
    for site in json.loads(Path(args.sites).read_text()):
        radius = SEARCH_RADIUS_M.get(site["id"])
        if radius is None or (args.only and site["id"] != args.only):
            continue
        best = search(args.dem30, site["lat"], site["lon"], radius, sun_vec, earth_vec)
        best["crater"] = site["id"]
        results.append(best)
        print(site["id"], {k: round(v, 3) if isinstance(v, float) else v for k, v in best.items()}, flush=True)
    Path(args.out).write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    main()
