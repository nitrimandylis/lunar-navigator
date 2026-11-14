import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin

import terrain


# Known answers: the same points projected by GDAL/PROJ with the Moon polar stereographic
# definition stored in the LRO LOLA DEM v4 S Pole GeoTIFFs (checked 2026-11-14).
@pytest.mark.parametrize(
    "lat, lon, x, y",
    [
        (-89.9, 129.78, 2330.4, -1940.2),
        (-89.0, 0.0, 0.0, 30324.1),
        (-89.0, 90.0, 30324.1, 0.0),
        (-88.0, 200.0, -20744.5, -56995.0),
        (-87.6, 300.0, -63035.1, 36393.3),
    ],
)
def test_projection_matches_gdal(lat, lon, x, y):
    px, py = terrain.lonlat_to_xy(lat, lon)
    assert px == pytest.approx(x, abs=0.1)
    assert py == pytest.approx(y, abs=0.1)


def test_scale_factor():
    assert terrain.scale_factor(-90.0) == pytest.approx(1.0)
    # 2 / (1 + cos 5 degrees) = 1.0019 at 85 S
    assert terrain.scale_factor(-85.0) == pytest.approx(1.001906, abs=1e-5)


def make_dem(path, left, top, size, res, wall=None):
    """A flat DEM with an optional 200 m wall: wall(x_array, y_array) -> bool mask."""
    heights = np.zeros((size, size), dtype="float32")
    if wall is not None:
        xs = left + (np.arange(size) + 0.5) * res
        ys = top - (np.arange(size) + 0.5) * res
        gx, gy = np.meshgrid(xs, ys)
        heights[wall(gx, gy)] = 200.0
    with rasterio.open(
        path, "w", driver="GTiff", height=size, width=size, count=1, dtype="float32",
        transform=from_origin(left, top, res, res), nodata=-3.4e38,
    ) as dst:
        dst.write(heights, 1)


def elev_at(h, az):
    return h.elev_deg[int(round(az / (h.az_deg[1] - h.az_deg[0]))) % len(h.az_deg)]


def test_north_is_away_from_the_pole(tmp_path):
    # Site at 89 S, lon 90: map position (30324, 0). North there is +x (away from the pole).
    path = str(tmp_path / "dem.tif")
    make_dem(path, left=28000.0, top=3000.0, size=500, res=10.0,
             wall=lambda gx, gy: gx > 30324.1 + 1000)
    h = terrain.site_horizon(path, -89.0, 90.0, max_range_m=1500)
    assert elev_at(h, 0) > 5.0  # wall is north of the site
    assert elev_at(h, 90) < 0.0
    assert elev_at(h, 180) < 0.0


def test_east_is_clockwise_from_north(tmp_path):
    # At lon 90 east is -y (east = direction of increasing longitude, which turns toward
    # the pole's -y side here). A wall to -y must show up at azimuth 90.
    path = str(tmp_path / "dem.tif")
    make_dem(path, left=28000.0, top=3000.0, size=500, res=10.0,
             wall=lambda gx, gy: gy < -1000)
    h = terrain.site_horizon(path, -89.0, 90.0, max_range_m=1500)
    assert elev_at(h, 90) > 5.0
    assert elev_at(h, 0) < 0.0


def test_site_outside_dem_raises(tmp_path):
    path = str(tmp_path / "dem.tif")
    make_dem(path, left=28000.0, top=3000.0, size=100, res=10.0)
    with pytest.raises(ValueError):
        terrain.site_horizon(path, -80.0, 0.0)


def test_window_is_clipped_at_the_dem_edge(tmp_path):
    # The site is 500 m from the east edge, but we ask for 1500 m: the ray stops early.
    path = str(tmp_path / "dem.tif")
    make_dem(path, left=28000.0, top=1250.0, size=250, res=10.0)  # x 28000..30500, y 1250..-1250
    h = terrain.site_horizon(path, -89.0, 90.0, max_range_m=1500)
    assert h.reach_m[0] < 600  # north (+x) hits the edge
    assert h.reach_m[180] > 1000
