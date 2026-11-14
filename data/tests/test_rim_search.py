import json
from pathlib import Path

import numpy as np
import pytest

import horizons
import rim_search as rs
import terrain

FIXTURES = Path(__file__).parent / "fixtures"


def real(body, site):
    result = json.loads((FIXTURES / f"horizons_{body}_{site}.json").read_text())["result"]
    s = horizons.parse_horizons(result)
    return np.array([x.az_deg for x in s]), np.array([x.elev_deg for x in s])


def test_round_trip_through_vectors_is_identity():
    az, el = np.array([10.0, 123.0, 300.0]), np.array([-4.0, 1.0, 20.0])
    v = rs.to_vectors(az, el, -85.0, 40.0)
    az2, el2 = rs.from_vectors(v, -85.0, 40.0)
    assert np.allclose(az, az2) and np.allclose(el, el2)


@pytest.mark.parametrize("body, tolerance_deg", [("sun", 0.01), ("earth", 0.05)])
def test_moving_to_another_site_matches_real_horizons(body, tolerance_deg):
    # Real Horizons directions at 89.9 S, 0 E, re-expressed at 85.28 S, 53.27 E (Nobile),
    # must match what Horizons itself gives at Nobile. Earth is closer, so it has more parallax.
    az0, el0 = real(body, "pole")
    az1, el1 = real(body, "nobile")
    v = rs.to_vectors(az0, el0, -89.9, 0.0)
    az, el = rs.from_vectors(v, -85.28, 53.27)
    assert np.allclose(el, el1, atol=tolerance_deg)
    assert np.allclose(az, az1, atol=tolerance_deg * 10)  # azimuth moves faster near the pole


def test_xy_to_lonlat_matches_gdal_values():
    lat, lon = terrain.xy_to_lonlat(30324.1, 0.0)
    assert lat == pytest.approx(-89.0, abs=1e-4)
    assert lon == pytest.approx(90.0, abs=1e-4)
    lat, lon = terrain.xy_to_lonlat(-20744.5, -56995.0)
    assert lat == pytest.approx(-88.0, abs=1e-3)
    assert lon == pytest.approx(200.0, abs=1e-3)


def test_xy_round_trip():
    for lat, lon in [(-89.67, 129.78), (-84.5, 82.8), (-86.9, 356.0)]:
        x, y = terrain.lonlat_to_xy(lat, lon)
        lat2, lon2 = terrain.xy_to_lonlat(x, y)
        assert lat2 == pytest.approx(lat, abs=1e-9)
        assert lon2 == pytest.approx(lon % 360, abs=1e-9)


def test_candidate_points_stay_inside_the_circle():
    pts = rs.candidate_points(1000.0, 2000.0, 5000.0, 1000.0)
    assert (1000.0, 2000.0) in pts
    assert all(np.hypot(x - 1000.0, y - 2000.0) <= 5000.0 for x, y in pts)
    assert len(pts) == 81  # 11 x 11 grid minus the corners outside the circle: 97 - 16
