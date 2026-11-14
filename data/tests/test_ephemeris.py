import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

import ephemeris
import horizons

FIXTURES = Path(__file__).parent / "fixtures"
START = datetime(2027, 1, 1, tzinfo=timezone.utc)


def load(name):
    return json.loads((FIXTURES / name).read_text())["result"]


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


def test_first_row_matches_horizons():
    # Real Horizons output (Moon seen from Earth's centre), 2027-01-01 00:00 UTC.
    rows = ephemeris.parse_subpoints(load("horizons_subpoints.json"))
    assert len(rows) == 4
    r = rows[0]
    assert r["sub_earth_lon_deg"] == 7.187181
    assert r["sub_earth_lat_deg"] == 5.995953
    assert r["sub_solar_lon_deg"] == 263.115854
    assert r["sub_solar_lat_deg"] == -1.014590
    # Horizons gives 0.00261675600517 au; 1 au = 149,597,870.7 km. About 391,000 km.
    assert r["earth_distance_km"] == pytest.approx(391_460, abs=5)


def test_subpoints_agree_with_az_el_seen_from_the_pole():
    # Two separate Horizons answers must agree. Seen from 89.9 S, the Sun's azimuth is the
    # sub-solar longitude and its elevation is minus the sub-solar latitude (a 0.1 degree
    # offset from the pole allows about 0.02 degrees); same for Earth.
    sub = ephemeris.parse_subpoints(load("horizons_subpoints.json"))[0]
    sun = horizons.parse_horizons(load("horizons_sun_pole.json"))[0]
    earth = horizons.parse_horizons(load("horizons_earth_pole.json"))[0]
    assert sun.az_deg == pytest.approx(sub["sub_solar_lon_deg"], abs=0.01)
    assert sun.elev_deg == pytest.approx(-sub["sub_solar_lat_deg"], abs=0.02)
    assert earth.az_deg == pytest.approx(sub["sub_earth_lon_deg"], abs=0.01)
    assert earth.elev_deg == pytest.approx(-sub["sub_earth_lat_deg"], abs=0.2)


def test_missing_table_raises():
    with pytest.raises(ValueError):
        ephemeris.parse_subpoints("No ephemeris for target.")


def test_build_ephemeris_shape():
    class Session:
        def get(self, url, params, timeout):
            assert params["COMMAND"] == "'301'" and params["CENTER"] == "'500@399'"
            assert params["QUANTITIES"] == "'14,15,20'"
            return FakeResponse({"result": load("horizons_subpoints.json")})

    out = ephemeris.build_ephemeris(START, 4, session=Session())
    assert out["start_utc"] == "2027-01-01T00:00:00Z"
    assert out["count"] == 4
    for key in ("sub_solar_lon_deg", "sub_solar_lat_deg", "sub_earth_lon_deg", "sub_earth_lat_deg", "earth_distance_km"):
        assert len(out[key]) == 4
    assert out["sub_solar_lon_deg"][0] == 263.1159
