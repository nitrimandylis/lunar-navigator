"""Read terrain around a lunar south pole site from a LOLA DEM GeoTIFF.

The DEMs (LRO LOLA DEM v4 S Pole, NASA Moon Trek) are in south polar stereographic
projection, centred on 0 degrees longitude, heights in metres above a 1,737,400 m sphere.
At the pole "up the image" is +y; local north at a site points away from the pole, which
is `lon` degrees clockwise from up.
"""

from __future__ import annotations

import math

import numpy as np
import rasterio
from rasterio.windows import Window

from horizon_mask import MOON_RADIUS_M, Horizon, horizon_profile


def lonlat_to_xy(lat_deg: float, lon_deg: float) -> tuple[float, float]:
    """Latitude/east longitude on the Moon to projection metres (x east of pole, y up)."""
    colat = math.radians(90.0 + lat_deg)  # angle from the south pole
    rho = 2.0 * MOON_RADIUS_M * math.tan(colat / 2.0)
    lon = math.radians(lon_deg)
    return rho * math.sin(lon), rho * math.cos(lon)


def xy_to_lonlat(x: float, y: float) -> tuple[float, float]:
    """Projection metres back to (lat, east lon in 0..360)."""
    rho = math.hypot(x, y)
    colat = 2.0 * math.atan(rho / (2.0 * MOON_RADIUS_M))
    lon = math.degrees(math.atan2(x, y)) % 360.0
    return -90.0 + math.degrees(colat), lon


def scale_factor(lat_deg: float) -> float:
    """How much the map stretches distances at this latitude (1.0 at the pole)."""
    colat = math.radians(90.0 + lat_deg)
    return 2.0 / (1.0 + math.cos(colat))


def horizon_at_xy(
    dem_path: str,
    x: float,
    y: float,
    north_deg: float,
    ground_scale: float = 1.0,
    max_range_m: float = 30_000.0,
    observer_height_m: float = 0.0,
    az_step_deg: float = 1.0,
) -> Horizon:
    """Horizon seen from projection point (x, y). `ground_scale` is `scale_factor` there."""
    with rasterio.open(dem_path) as dem:
        res = dem.res[0]
        pixel_m = res / ground_scale  # real ground distance covered by one pixel
        col_f, row_f = (~dem.transform) @ (x, y)
        col_f -= 0.5  # integer index = pixel centre
        row_f -= 0.5
        if not (0 <= row_f <= dem.height - 1 and 0 <= col_f <= dem.width - 1):
            raise ValueError("site is outside this DEM")

        n = int(math.ceil(max_range_m / pixel_m)) + 2
        r0 = max(0, int(math.floor(row_f)) - n)
        c0 = max(0, int(math.floor(col_f)) - n)
        r1 = min(dem.height, int(math.floor(row_f)) + n + 2)
        c1 = min(dem.width, int(math.floor(col_f)) + n + 2)
        data = dem.read(1, window=Window(c0, r0, c1 - c0, r1 - r0)).astype(np.float64)
        nodata = dem.nodata

    if nodata is not None and np.any(data == nodata):
        raise ValueError("DEM has no-data cells near the site")
    return horizon_profile(
        data,
        row_f - r0,
        col_f - c0,
        pixel_m,
        north_deg=north_deg,
        max_range_m=max_range_m,
        az_step_deg=az_step_deg,
        observer_height_m=observer_height_m,
    )


def site_horizon(
    dem_path: str,
    lat_deg: float,
    lon_deg: float,
    max_range_m: float = 30_000.0,
    observer_height_m: float = 0.0,
    az_step_deg: float = 1.0,
) -> Horizon:
    """Terrain horizon at a lunar south pole site."""
    x, y = lonlat_to_xy(lat_deg, lon_deg)
    return horizon_at_xy(
        dem_path,
        x,
        y,
        north_deg=lon_deg,
        ground_scale=scale_factor(lat_deg),
        max_range_m=max_range_m,
        observer_height_m=observer_height_m,
        az_step_deg=az_step_deg,
    )
