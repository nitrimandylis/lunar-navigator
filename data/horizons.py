"""Sun and Earth azimuth/elevation at a lunar surface site, from JPL Horizons.

Source: NASA/JPL Horizons API, https://ssd.jpl.nasa.gov/api/horizons.api
Elevation is measured above a smooth Moon (flat horizon = 0). The Moon has no
atmosphere, so there is no refraction. Terrain is handled elsewhere.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import requests

API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"

SUN = "10"
EARTH = "399"
MOON_CENTER = "coord@301"

RETRIES = 4
RETRY_WAIT_S = 5.0

# Horizons rejects very long tables, so a year is fetched in pieces.
MAX_STEPS_PER_REQUEST = 24 * 30

_MONTHS = {
    m: i
    for i, m in enumerate(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        start=1,
    )
}

# "2027-Jan-01 00:00 *   263.113923   1.001924"
# After the time there is an optional flag (for example "*"), then azimuth, then elevation.
_ROW = re.compile(
    r"^\s*(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}):(\d{2})\s+(?:[^\d\s-]+\s+)?(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*$"
)


@dataclass(frozen=True)
class Sample:
    time: datetime  # UTC
    az_deg: float  # clockwise from north, 0 to 360
    elev_deg: float  # above a smooth Moon


def parse_horizons(result: str) -> list[Sample]:
    """Parse the text table inside a Horizons API response."""
    if "$$SOE" not in result or "$$EOE" not in result:
        raise ValueError(f"No ephemeris table in Horizons response: {result[:300]!r}")
    table = result.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    samples = []
    for line in table.splitlines():
        if not line.strip():
            continue
        m = _ROW.match(line)
        if m is None:
            raise ValueError(f"Cannot parse Horizons row: {line!r}")
        year, mon, day, hour, minute, az, elev = m.groups()
        when = datetime(int(year), _MONTHS[mon], int(day), int(hour), int(minute), tzinfo=timezone.utc)
        samples.append(Sample(when, float(az), float(elev)))
    return samples


def _fmt(t: datetime) -> str:
    return t.strftime("%Y-%m-%d %H:%M")


def _get(http, params) -> str:
    """One Horizons request, retried when the connection fails or times out."""
    for attempt in range(RETRIES):
        try:
            resp = http.get(API_URL, params=params, timeout=60)
            resp.raise_for_status()
            return resp.json()["result"]
        except requests.RequestException:
            if attempt == RETRIES - 1:
                raise
            time.sleep(RETRY_WAIT_S * (attempt + 1))
    raise AssertionError("unreachable")


def fetch_series(
    body: str,
    lon_deg: float,
    lat_deg: float,
    start: datetime,
    count: int,
    step_minutes: int = 60,
    alt_km: float = 0.0,
    session: requests.Session | None = None,
) -> list[Sample]:
    """Azimuth/elevation of `body` (SUN or EARTH) from a lunar site.

    `count` samples, `step_minutes` apart, first one at `start` (UTC).
    `lon_deg` is east-positive. `alt_km` is height above the lunar reference sphere.
    """
    http = session or requests
    step = timedelta(minutes=step_minutes)
    out: list[Sample] = []
    for first in range(0, count, MAX_STEPS_PER_REQUEST):
        last = min(first + MAX_STEPS_PER_REQUEST, count) - 1
        params = {
            "format": "json",
            "COMMAND": f"'{body}'",
            "OBJ_DATA": "'NO'",
            "MAKE_EPHEM": "'YES'",
            "EPHEM_TYPE": "'OBSERVER'",
            "CENTER": f"'{MOON_CENTER}'",
            "COORD_TYPE": "'GEODETIC'",
            "SITE_COORD": f"'{lon_deg},{lat_deg},{alt_km}'",
            "START_TIME": f"'{_fmt(start + first * step)}'",
            "STOP_TIME": f"'{_fmt(start + last * step)}'",
            "STEP_SIZE": f"'{step_minutes}m'",
            "QUANTITIES": "'4'",
            "ANG_FORMAT": "'DEG'",
            "CAL_FORMAT": "'CAL'",
            "REF_SYSTEM": "'ICRF'",
        }
        out.extend(parse_horizons(_get(http, params)))
    if len(out) != count:
        raise ValueError(f"Asked Horizons for {count} samples, got {len(out)}")
    return out
