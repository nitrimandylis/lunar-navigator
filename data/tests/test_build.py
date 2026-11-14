import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin

import build
import horizon_mask as hm
import horizons

FIXTURES = Path(__file__).parent / "fixtures"
START = datetime(2027, 1, 1, tzinfo=timezone.utc)


def flat_horizon(deg):
    return hm.Horizon(np.arange(360.0), np.full(360, float(deg)), np.zeros(360))


def test_longest_run():
    assert build.longest_run(np.array([1, 1, 0, 0, 0, 1, 0], dtype=bool)) == 3
    assert build.longest_run(np.array([1, 1], dtype=bool)) == 0
    assert build.longest_run(np.array([0, 0, 0], dtype=bool)) == 3


def test_visible_mask_with_real_horizons_sun_values():
    # Real Horizons Sun elevations at 89.9 S: 1.001924, 1.000363, 0.998804, 0.997249, ...
    result = json.loads((FIXTURES / "horizons_sun_pole.json").read_text())["result"]
    sun = horizons.parse_horizons(result)
    az = np.array([s.az_deg for s in sun])
    el = np.array([s.elev_deg for s in sun])
    assert hm.visible_mask(flat_horizon(1.0), az, el).tolist() == [True, True, False, False, False, False]
    assert hm.visible_mask(flat_horizon(0.0), az, el).all()
    assert not hm.visible_mask(flat_horizon(2.0), az, el).any()


def test_visible_mask_uses_the_azimuth_of_the_body():
    h = hm.Horizon(np.arange(360.0), np.where(np.arange(360) == 90, 10.0, 0.0), np.zeros(360))
    az = np.array([90.0, 270.0])
    el = np.array([5.0, 5.0])
    assert hm.visible_mask(h, az, el).tolist() == [False, True]


def test_daily_summary():
    # Two days of hourly data. Day 1: Sun for hours 0-11, Earth for hours 6-17.
    sun_vis = np.zeros(48, dtype=bool)
    sun_vis[0:12] = True
    earth_vis = np.zeros(48, dtype=bool)
    earth_vis[6:18] = True
    elev = np.linspace(-1.0, 1.0, 48)
    days = build.daily_summary(START, 60, elev, sun_vis, earth_vis)
    assert [d["date"] for d in days] == ["2027-01-01", "2027-01-02"]
    assert days[0]["sun_hours"] == 12.0
    assert days[0]["earth_hours"] == 12.0
    assert days[0]["longest_sun_gap_hours"] == 12.0  # hours 12-23 have no Sun
    assert days[1]["sun_hours"] == 0.0
    assert days[1]["longest_sun_gap_hours"] == 24.0
    assert days[1]["max_sun_elev_deg"] == 1.0


def test_pick_dem_uses_fine_dem_only_when_the_search_circle_fits(tmp_path):
    fine = str(tmp_path / "fine.tif")
    heights = np.zeros((100, 100), dtype="float32")
    # A fine DEM that reaches 40 km from the pole in every direction.
    with rasterio.open(fine, "w", driver="GTiff", height=100, width=100, count=1, dtype="float32",
                       transform=from_origin(-40_000, 40_000, 800, 800)) as dst:
        dst.write(heights, 1)
    # Shackleton is ~3 km from the pole: 3 + 25 km fits inside 40 km.
    assert build.pick_dem(-89.67, 129.78, fine, "coarse.tif") == fine
    # Haworth is ~94 km from the pole: does not fit.
    assert build.pick_dem(-86.9, -4.0, fine, "coarse.tif") == "coarse.tif"
