import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

import horizons

FIXTURES = Path(__file__).parent / "fixtures"
START = datetime(2027, 1, 1, tzinfo=timezone.utc)


def load(name: str) -> str:
    return json.loads((FIXTURES / name).read_text())["result"]


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


class RecordingSession:
    """Stands in for Horizons: answers from a saved real response."""

    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    def get(self, url, params, timeout):
        self.calls.append(params)
        return FakeResponse(self.payload)


# Known-answer tests. The fixtures are real Horizons responses (Sun and Earth seen from
# 89.9 S, lon 0, on the Moon, 2027-01-01 00:00 to 05:00 UTC, retrieved 2026-11-14).
def test_sun_first_and_last_row_match_horizons():
    samples = horizons.parse_horizons(load("horizons_sun_pole.json"))
    assert len(samples) == 6
    assert samples[0].time == START
    assert samples[0].az_deg == 263.113923
    assert samples[0].elev_deg == 1.001924
    assert samples[-1].time == START + timedelta(hours=5)
    assert samples[-1].elev_deg == 0.994148


def test_earth_is_below_the_horizon_at_that_time():
    samples = horizons.parse_horizons(load("horizons_earth_pole.json"))
    assert samples[0].az_deg == 7.184252
    assert samples[0].elev_deg == -6.149075
    assert all(s.elev_deg < 0 for s in samples)


def test_sun_stays_within_lunar_axial_tilt_near_the_pole():
    # The Moon's spin axis is tilted 1.54 degrees from the ecliptic (IAU), and the site is
    # 0.1 degrees from the pole, so the Sun cannot be higher than about 1.7 degrees.
    samples = horizons.parse_horizons(load("horizons_sun_pole.json"))
    assert all(abs(s.elev_deg) < 1.7 for s in samples)


def test_missing_table_raises():
    with pytest.raises(ValueError):
        horizons.parse_horizons("No ephemeris for target.")


def test_fetch_series_sends_site_and_body():
    session = RecordingSession({"result": load("horizons_sun_pole.json")})
    samples = horizons.fetch_series(horizons.SUN, 0.0, -89.9, START, 6, session=session)
    assert len(samples) == 6
    (params,) = session.calls
    assert params["COMMAND"] == "'10'"
    assert params["CENTER"] == "'coord@301'"
    assert params["SITE_COORD"] == "'0.0,-89.9,0.0'"
    assert params["START_TIME"] == "'2027-01-01 00:00'"
    assert params["STOP_TIME"] == "'2027-01-01 05:00'"


def test_fetch_series_splits_long_ranges():
    count = horizons.MAX_STEPS_PER_REQUEST * 2 + 5

    class Generating:
        calls = []

        def get(self, url, params, timeout):
            self.calls.append(params)
            first = datetime.strptime(params["START_TIME"].strip("'"), "%Y-%m-%d %H:%M")
            last = datetime.strptime(params["STOP_TIME"].strip("'"), "%Y-%m-%d %H:%M")
            rows, t = [], first
            while t <= last:
                rows.append(f" {t.year}-{t.strftime('%b')}-{t.day:02d} {t:%H:%M} *   10.000000   1.000000")
                t += timedelta(hours=1)
            return FakeResponse({"result": "$$SOE\n" + "\n".join(rows) + "\n$$EOE"})

    session = Generating()
    samples = horizons.fetch_series(horizons.SUN, 0.0, -89.9, START, count, session=session)
    assert len(session.calls) == 3
    assert len(samples) == count
    assert samples[-1].time == START + timedelta(hours=count - 1)
