import math

import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin

import slope
import terrain

LAT, LON = -86.0, 30.0


def make_plane_dem(path, res, size, slope_deg, az_rad=0.4):
    """A DEM whose true ground slope is `slope_deg`, centred on the projection point of LAT/LON.

    Pixel size `res` is in projection metres, so the true ground spacing is res / scale_factor.
    """
    x0, y0 = terrain.lonlat_to_xy(LAT, LON)
    k = terrain.scale_factor(LAT)
    t = math.tan(math.radians(slope_deg))
    cols = (np.arange(size) + 0.5) * res - size * res / 2  # projection metres east of centre
    rows = size * res / 2 - (np.arange(size) + 0.5) * res  # projection metres north of centre
    xx, yy = np.meshgrid(cols / k, rows / k)  # ground metres
    z = 1000.0 + t * (xx * math.cos(az_rad) + yy * math.sin(az_rad))
    transform = from_origin(x0 - size * res / 2, y0 + size * res / 2, res, res)
    with rasterio.open(
        path, "w", driver="GTiff", height=size, width=size, count=1, dtype="float32", transform=transform
    ) as dst:
        dst.write(z.astype("float32"), 1)
    return z


@pytest.mark.parametrize("deg", [0.0, 3.0, 10.0, 25.0])
def test_horn_on_plane(deg):
    t = math.tan(math.radians(deg))
    j, i = np.meshgrid(np.arange(3), np.arange(3))
    z = 50.0 + t * (30.0 * j * 0.6 - 30.0 * i * 0.8)  # rows down, so -i is north
    assert slope.horn_slope_deg(z, 30.0) == pytest.approx(deg, abs=1e-9)


@pytest.mark.parametrize("deg", [0.0, 5.0, 20.0])
def test_30m_dem_plane_uses_true_scale(tmp_path, deg):
    p = tmp_path / "d30.tif"
    make_plane_dem(p, 30.0, 40, deg)
    s, elev = slope.slope_and_elevation_30m(str(p), LAT, LON)
    assert s == pytest.approx(deg, abs=0.01)
    assert elev == pytest.approx(1000.0, abs=0.5)


@pytest.mark.parametrize("deg", [0.0, 5.0, 20.0])
def test_5m_averaged_plane(tmp_path, deg):
    p = tmp_path / "d5.tif"
    make_plane_dem(p, 5.0, 60, deg)
    assert slope.slope_5m_averaged(str(p), LAT, LON) == pytest.approx(deg, abs=0.01)


def test_5m_outside_dem_returns_none(tmp_path):
    p = tmp_path / "d5.tif"
    make_plane_dem(p, 5.0, 60, 5.0)
    assert slope.slope_5m_averaged(str(p), -88.0, 30.0) is None


def test_block_mean():
    z = np.arange(16, dtype=float).reshape(4, 4)
    assert slope.block_mean(z, 2).tolist() == [[2.5, 4.5], [10.5, 12.5]]
