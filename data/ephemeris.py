"""Where the Sun and Earth are over the Moon, hour by hour, for any point on the Moon.

For a custom latitude/longitude the app can work out Sun and Earth elevation itself from
the sub-solar point (where the Sun is straight overhead) and the sub-Earth point.

Source: NASA/JPL Horizons API, Moon as target seen from the centre of the Earth.
Table items: 14 observer sub-longitude/latitude (sub-Earth point), 15 Sun sub-longitude/
latitude (sub-solar point), 20 observer range (Earth to Moon distance).
Longitudes are east-positive, 0 to 360 degrees, in the Moon's mean-Earth frame.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta

import requests

import horizons

AU_KM = 149_597_870.7

# "2027-Jan-01 00:00       7.187181   5.995953  263.115854  -1.014590  0.00261675600517   0.0577881"
_NUM = r"(-?\d+\.\d+)"
_ROW = re.compile(
    r"^\s*(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}):(\d{2})\s+(?:[^\d\s-]+\s+)?" + r"\s+".join([_NUM] * 6) + r"\s*$"
)


def parse_subpoints(result: str) -> list[dict]:
    """Rows of the Horizons table: sub-Earth lon/lat, sub-solar lon/lat, Earth distance (km)."""
    if "$$SOE" not in result or "$$EOE" not in result:
        raise ValueError(f"No ephemeris table in Horizons response: {result[:300]!r}")
    table = result.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    rows = []
    for line in table.splitlines():
        if not line.strip():
            continue
        m = _ROW.match(line)
        if m is None:
            raise ValueError(f"Cannot parse Horizons row: {line!r}")
        e_lon, e_lat, s_lon, s_lat, delta_au, _ = (float(v) for v in m.groups()[5:])
        rows.append(
            {
                "sub_earth_lon_deg": e_lon,
                "sub_earth_lat_deg": e_lat,
                "sub_solar_lon_deg": s_lon,
                "sub_solar_lat_deg": s_lat,
                "earth_distance_km": delta_au * AU_KM,
            }
        )
    return rows


def fetch_subpoints(start: datetime, count: int, step_minutes: int = 60, session=None) -> list[dict]:
    http = session or requests
    step = timedelta(minutes=step_minutes)
    out: list[dict] = []
    for first in range(0, count, horizons.MAX_STEPS_PER_REQUEST):
        last = min(first + horizons.MAX_STEPS_PER_REQUEST, count) - 1
        params = {
            "format": "json",
            "COMMAND": "'301'",
            "OBJ_DATA": "'NO'",
            "MAKE_EPHEM": "'YES'",
            "EPHEM_TYPE": "'OBSERVER'",
            "CENTER": "'500@399'",
            "START_TIME": f"'{horizons._fmt(start + first * step)}'",
            "STOP_TIME": f"'{horizons._fmt(start + last * step)}'",
            "STEP_SIZE": f"'{step_minutes}m'",
            "QUANTITIES": "'14,15,20'",
            "ANG_FORMAT": "'DEG'",
            "CAL_FORMAT": "'CAL'",
        }
        out.extend(parse_subpoints(horizons._get(http, params)))
    if len(out) != count:
        raise ValueError(f"Asked Horizons for {count} samples, got {len(out)}")
    return out


def build_ephemeris(start: datetime, count: int, step_minutes: int = 60, session=None) -> dict:
    """The file the app reads: same hours as the site files, one array per quantity."""
    rows = fetch_subpoints(start, count, step_minutes, session)
    return {
        "start_utc": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "step_minutes": step_minutes,
        "count": count,
        "sub_solar_lon_deg": [round(r["sub_solar_lon_deg"], 4) for r in rows],
        "sub_solar_lat_deg": [round(r["sub_solar_lat_deg"], 4) for r in rows],
        "sub_earth_lon_deg": [round(r["sub_earth_lon_deg"], 4) for r in rows],
        "sub_earth_lat_deg": [round(r["sub_earth_lat_deg"], 4) for r in rows],
        "earth_distance_km": [round(r["earth_distance_km"]) for r in rows],
    }
