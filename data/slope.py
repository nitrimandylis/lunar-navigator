"""Ground slope at each site, in degrees, from the LOLA DEM (the `slope_deg` field of sites.json).

Method (one for every site): Horn (1981) 3x3 slope on the 30 m LOLA DEM (LRO LOLA DEM v4 S Pole,
75 deg, 30 m per pixel, which covers all 18 sites). The 3x3 window spans 60 m but its weights give
a gradient over a 30 m pixel spacing. The gradient is evaluated at the four pixel centres around
the site and interpolated bilinearly to the exact point, so it does not jump with pixel choice.
Pixel spacing is the true ground distance, `res / terrain.scale_factor(lat)`, as in terrain.py.

`--check-5m` also computes the slope from the 5 m DEM (where it covers the site): the 5 m heights
are averaged into 30 m cells centred on the site, then the same Horn formula is applied. It is a
cross-check only; it is not what goes in sites.json.

Usage (from the repo root):
    data/.venv/Scripts/python data/slope.py --dem30 <30 m .tif> [--dem5 <5 m .tif>] [--write]
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.windows import Window

from terrain import lonlat_to_xy, scale_factor

BASELINE_M = 30.0


def horn_gradient(z: np.ndarray, spacing_m: float) -> tuple[float, float]:
    """Horn 3x3 gradient at the centre of `z` (rows run down the image, +y is up).

    Returns (dz/dx, dz/dy) with x to the right and y up, in metres per metre.
    """
    a, b, c = z[0, 0], z[0, 1], z[0, 2]
    d, f = z[1, 0], z[1, 2]
    g, h, i = z[2, 0], z[2, 1], z[2, 2]
    dzdx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8.0 * spacing_m)
    dzdy = ((a + 2 * b + c) - (g + 2 * h + i)) / (8.0 * spacing_m)
    return dzdx, dzdy


def slope_deg_from_gradient(dzdx: float, dzdy: float) -> float:
    return math.degrees(math.atan(math.hypot(dzdx, dzdy)))


def horn_slope_deg(z: np.ndarray, spacing_m: float) -> float:
    """Slope in degrees at the centre of a 3x3 height window with the given cell spacing."""
    return slope_deg_from_gradient(*horn_gradient(z, spacing_m))


def slope_interpolated_deg(win: np.ndarray, fr: float, fc: float, spacing_m: float) -> float:
    """Slope at a fractional position inside a 4x4 window.

    The point lies between the centre four cells; (fr, fc) in [0, 1) is its offset from the upper
    left of those four. Horn gradients at the four cells are blended bilinearly.
    """
    g = np.array([[horn_gradient(win[r : r + 3, c : c + 3], spacing_m) for c in (0, 1)] for r in (0, 1)])
    w = np.array([[(1 - fr) * (1 - fc), (1 - fr) * fc], [fr * (1 - fc), fr * fc]])
    dzdx = float((g[..., 0] * w).sum())
    dzdy = float((g[..., 1] * w).sum())
    return slope_deg_from_gradient(dzdx, dzdy)


def block_mean(z: np.ndarray, k: int) -> np.ndarray:
    """Average k x k blocks (z must be a multiple of k in each direction)."""
    r, c = z.shape
    return z.reshape(r // k, k, c // k, k).mean(axis=(1, 3))


def _locate(dem, lat: float, lon: float) -> tuple[float, float]:
    x, y = lonlat_to_xy(lat, lon)
    col_f, row_f = (~dem.transform) @ (x, y)
    col_f -= 0.5  # integer index = pixel centre
    row_f -= 0.5
    if not (2 <= row_f <= dem.height - 3 and 2 <= col_f <= dem.width - 3):
        raise ValueError("site is outside this DEM")
    return row_f, col_f


def _read(dem, row0: int, col0: int, n_rows: int, n_cols: int) -> np.ndarray:
    data = dem.read(1, window=Window(col0, row0, n_cols, n_rows)).astype(np.float64)
    if dem.nodata is not None and np.any(data == dem.nodata):
        raise ValueError("DEM has no-data cells near the site")
    return data


def slope_and_elevation_30m(dem_path: str, lat: float, lon: float) -> tuple[float, float]:
    """(slope in degrees, bilinear height in metres) from the 30 m DEM, Horn 3x3."""
    with rasterio.open(dem_path) as dem:
        spacing = dem.res[0] / scale_factor(lat)
        row_f, col_f = _locate(dem, lat, lon)
        r, c = int(math.floor(row_f)), int(math.floor(col_f))
        win = _read(dem, r - 1, c - 1, 4, 4)
    fr, fc = row_f - r, col_f - c
    elev = float((win[1:3, 1:3] * np.array([[(1 - fr) * (1 - fc), (1 - fr) * fc], [fr * (1 - fc), fr * fc]])).sum())
    return slope_interpolated_deg(win, fr, fc, spacing), elev


def slope_5m_averaged(dem_path: str, lat: float, lon: float) -> float | None:
    """Slope from the 5 m DEM averaged into 30 m cells centred on the site; None if not covered."""
    with rasterio.open(dem_path) as dem:
        spacing_px = dem.res[0] / scale_factor(lat)
        k = max(1, round(BASELINE_M / spacing_px))  # 6 pixels of 5 m
        try:
            row_f, col_f = _locate(dem, lat, lon)
        except ValueError:
            return None
        # Block edges fall on pixel edges, with the site's pixel edge nearest the middle of the
        # centre block (so the site is within half a 5 m pixel of the centre of the middle cell).
        row_c, col_c = round(row_f + 0.5), round(col_f + 0.5)  # nearest pixel edge
        r0, c0 = row_c - 3 * k // 2, col_c - 3 * k // 2
        if r0 < 0 or c0 < 0 or r0 + 3 * k > dem.height or c0 + 3 * k > dem.width:
            return None
        z = _read(dem, r0, c0, 3 * k, 3 * k)
    return horn_slope_deg(block_mean(z, k), k * spacing_px)


def main() -> None:
    here = Path(__file__).resolve().parent
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--dem30", default=str(here / "raw/LRO_LOLA_DEM_SPole75_30mp_v04.tif"))
    p.add_argument("--dem5", default=None, help="5 m DEM, for the cross-check")
    p.add_argument("--sites", default=str(here / "sites.json"))
    p.add_argument("--public", default=str(here.parent / "public/data/sites.json"))
    p.add_argument("--write", action="store_true", help="add slope_deg to --sites and --public")
    args = p.parse_args()

    sites = json.loads(Path(args.sites).read_text())
    print(f"{'id':28s} {'slope30':>8s} {'slope5avg':>9s} {'diff':>6s} {'elev_m':>8s} {'sites.json':>10s}")
    for s in sites:
        sl, elev = slope_and_elevation_30m(args.dem30, s["lat"], s["lon"])
        # slope_deg goes right after elevation_m
        items = [(k, v) for k, v in s.items() if k != "slope_deg"]
        at = [k for k, _ in items].index("elevation_m") + 1
        items.insert(at, ("slope_deg", round(sl, 1)))
        s.clear()
        s.update(items)
        s5 = slope_5m_averaged(args.dem5, s["lat"], s["lon"]) if args.dem5 else None
        c5 = f"{s5:9.2f}" if s5 is not None else f"{'-':>9s}"
        df = f"{s5 - sl:6.2f}" if s5 is not None else f"{'-':>6s}"
        print(f"{s['id']:28s} {sl:8.2f} {c5} {df} {elev:8.1f} {s['elevation_m']:10}")
    if args.write:
        Path(args.sites).write_text(json.dumps(sites, indent=2) + "\n")
        Path(args.public).write_text(json.dumps(sites, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
