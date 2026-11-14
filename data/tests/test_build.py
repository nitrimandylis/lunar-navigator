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


def test_dark_run_lengths():
    flags = np.array([1, 1, 0, 0, 0, 1, 0], dtype=bool)
    assert build.dark_run_lengths(flags).tolist() == [0, 0, 3, 3, 3, 0, 1]
    assert build.dark_run_lengths(np.array([1, 1], dtype=bool)).tolist() == [0, 0]
    assert build.dark_run_lengths(np.array([0, 0, 0], dtype=bool)).tolist() == [3, 3, 3]


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
    # Two days of hourly data. Sun for hours 0-11 of day 1, Earth for hours 6-17.
    sun_vis = np.zeros(48, dtype=bool)
    sun_vis[0:12] = True
    earth_vis = np.zeros(48, dtype=bool)
    earth_vis[6:18] = True
    elev = np.linspace(-1.0, 1.0, 48)
    days = build.daily_summary(START, 60, elev, sun_vis, earth_vis)
    assert [d["date"] for d in days] == ["2027-01-01", "2027-01-02"]
    assert days[0]["sun_hours"] == 12.0
    assert days[0]["earth_hours"] == 12.0
    assert days[1]["sun_hours"] == 0.0
    assert days[1]["max_sun_elev_deg"] == 1.0
    # The dark spell starts at hour 12 of day 1 and runs to the end of the data: 36 hours.
    assert days[0]["longest_sun_gap_hours"] == 36.0
    assert days[1]["longest_sun_gap_hours"] == 36.0


def test_sun_gap_across_midnight_counts_in_full():
    # Sun for hours 0-5, dark for hours 6-29 (24 h, crossing midnight), Sun again 30-47.
    sun_vis = np.ones(48, dtype=bool)
    sun_vis[6:30] = False
    elev = np.zeros(48)
    days = build.daily_summary(START, 60, elev, sun_vis, np.ones(48, dtype=bool))
    assert days[0]["longest_sun_gap_hours"] == 24.0  # old rule: 18 (hours 6-23 only)
    assert days[1]["longest_sun_gap_hours"] == 24.0  # old rule: 6 (hours 24-29 only)
    assert days[0]["sun_hours"] == 6.0 and days[1]["sun_hours"] == 18.0


def test_daily_summary_lit_day_has_no_gap():
    days = build.daily_summary(START, 60, np.zeros(24), np.ones(24, dtype=bool), np.ones(24, dtype=bool))
    assert days[0]["longest_sun_gap_hours"] == 0.0


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


def test_build_site_passes_the_observer_height(monkeypatch):
    calls = []

    def fake_site_horizon(*args, **kwargs):
        calls.append(kwargs["observer_height_m"])
        return flat_horizon(0.0)

    def fake_fetch_series(body, lon, lat, start, count, step_minutes):
        return [horizons.Sample(START, 10.0, 5.0) for _ in range(count)]

    monkeypatch.setattr(build.terrain, "site_horizon", fake_site_horizon)
    monkeypatch.setattr(build.horizons, "fetch_series", fake_fetch_series)
    site = {"id": "x", "lat": -89.0, "lon": 0.0}
    dist = np.full(24, 384_400.0)
    build.build_site(site, "dem.tif", START, 1, 60, dist)
    build.build_site(site, "dem.tif", START, 1, 60, dist, observer_height_m=5.0)
    assert calls == [2.0, 5.0]
