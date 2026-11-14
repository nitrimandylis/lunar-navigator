"""Terrain horizon seen from a point on a height grid.

For each compass azimuth, walk outward over the terrain and keep the largest angle
above the observer's local horizontal. A Sun or Earth higher than that angle (at that
azimuth) is visible; lower, it is hidden behind terrain.

The grid is a plain 2D array of heights in metres above the reference sphere of radius
MOON_RADIUS_M. Rows go down the image, columns go right, `pixel_m` is the ground size of
one pixel. Moon Trek's DEMs store radius, so the caller subtracts 1,737,400 m first.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

MOON_RADIUS_M = 1_737_400.0


@dataclass(frozen=True)
class Horizon:
    az_deg: np.ndarray  # 0, step, 2*step, ... clockwise from north
    elev_deg: np.ndarray  # highest terrain angle above local horizontal, per azimuth
    reach_m: np.ndarray  # how far the ray got before leaving the grid or hitting max_range


def _bilinear(grid: np.ndarray, row: np.ndarray, col: np.ndarray) -> np.ndarray:
    r0 = np.floor(row).astype(int)
    c0 = np.floor(col).astype(int)
    fr = row - r0
    fc = col - c0
    top = grid[r0, c0] * (1 - fc) + grid[r0, c0 + 1] * fc
    bottom = grid[r0 + 1, c0] * (1 - fc) + grid[r0 + 1, c0 + 1] * fc
    return top * (1 - fr) + bottom * fr


def horizon_profile(
    heights: np.ndarray,
    row: float,
    col: float,
    pixel_m: float,
    north_deg: float = 0.0,
    max_range_m: float = 50_000.0,
    az_step_deg: float = 1.0,
    observer_height_m: float = 0.0,
    min_range_m: float = 0.0,
    site_height_m: float | None = None,
) -> Horizon:
    """Horizon around (row, col).

    `north_deg` is the angle, clockwise, from "up the image" to local north. It is 0 for a
    map with north at the top. In a polar map it differs from site to site.
    `observer_height_m` is how far above the ground the viewer is (for example a lander).
    A ray that leaves the grid stops there, so near an edge `reach_m` is short.
    `min_range_m` skips terrain closer than that (a far-field pass uses it so a coarse grid
    cannot invent ridges next to the site). `site_height_m` replaces the height read from the
    grid at the site, for the same reason.
    """
    n_rows, n_cols = heights.shape
    if not (0 <= row <= n_rows - 1 and 0 <= col <= n_cols - 1):
        raise ValueError("site is outside the grid")

    if site_height_m is None:
        site = _bilinear(heights, np.array([min(row, n_rows - 1.000001)]), np.array([min(col, n_cols - 1.000001)]))[0]
    else:
        site = site_height_m
    r_obs = MOON_RADIUS_M + site + observer_height_m

    azimuths = np.arange(0.0, 360.0, az_step_deg)
    elev = np.full(azimuths.shape, -90.0)
    reach = np.zeros(azimuths.shape)

    steps = np.arange(max(1, int(math.ceil(min_range_m / pixel_m))), int(max_range_m / pixel_m) + 1)
    dist = steps * pixel_m
    theta = dist / MOON_RADIUS_M

    for i, az in enumerate(azimuths):
        a = np.radians(az + north_deg)
        rows = row - np.cos(a) * steps
        cols = col + np.sin(a) * steps
        inside = (rows >= 0) & (rows <= n_rows - 1.000001) & (cols >= 0) & (cols <= n_cols - 1.000001)
        if not inside.any():
            continue
        # Stop at the first point outside the grid.
        n_ok = int(np.argmin(inside)) if not inside.all() else len(inside)
        if n_ok == 0:
            continue
        h = _bilinear(heights, rows[:n_ok], cols[:n_ok])
        r = MOON_RADIUS_M + h
        t = theta[:n_ok]
        angle = np.arctan2(r * np.cos(t) - r_obs, r * np.sin(t))
        elev[i] = np.degrees(angle.max())
        reach[i] = dist[n_ok - 1]

    return Horizon(azimuths, elev, reach)


def visible_mask(horizon: Horizon, az_deg: np.ndarray, elev_deg: np.ndarray) -> np.ndarray:
    """For many bodies at once: True where (az, elev) is above the terrain horizon."""
    step = horizon.az_deg[1] - horizon.az_deg[0]
    index = np.round(np.asarray(az_deg) / step).astype(int) % len(horizon.az_deg)
    return np.asarray(elev_deg) > horizon.elev_deg[index]


def is_visible(horizon: Horizon, az_deg: float, elev_deg: float) -> bool:
    """True if a body at (az, elev) is above the terrain horizon there."""
    return bool(visible_mask(horizon, np.array([az_deg]), np.array([elev_deg]))[0])
