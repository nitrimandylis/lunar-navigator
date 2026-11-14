"""The committed JSON in public/data/ must stay in step with data/sites.json.

No internet and no terrain files needed: this only reads files already in git.
"""

import json
from datetime import date, timedelta
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SITES_SRC = ROOT / "data" / "sites.json"
PUBLIC = ROOT / "public" / "data"

COUNT = 8760
START_UTC = "2027-01-01T00:00:00Z"
HOURLY_ARRAYS = [
    "sun_elev_deg",
    "sun_az_deg",
    "earth_elev_deg",
    "earth_az_deg",
    "sun_visible",
    "earth_visible",
]
EPHEMERIS_ARRAYS = [
    "sub_solar_lon_deg",
    "sub_solar_lat_deg",
    "sub_earth_lon_deg",
    "sub_earth_lat_deg",
    "earth_distance_km",
]


def load(path: Path):
    assert path.is_file(), f"missing file: {path.relative_to(ROOT)}"
    return json.loads(path.read_text(encoding="utf-8"))


SITES = load(SITES_SRC)
SITE_IDS = [s["id"] for s in SITES]
_cache: dict[Path, object] = {}


def cached(path: Path):
    if path not in _cache:
        _cache[path] = load(path)
    return _cache[path]


def hourly(site_id):
    return cached(PUBLIC / "sites" / f"{site_id}.json")


def summary(site_id):
    return cached(PUBLIC / "summary" / f"{site_id}.json")


def test_public_sites_json_matches_source():
    public = load(PUBLIC / "sites.json")
    assert public == SITES, "public/data/sites.json differs from data/sites.json: re-run data/build.py"


@pytest.mark.parametrize("folder", ["sites", "summary"])
def test_one_file_per_site_and_no_stale_files(folder):
    d = PUBLIC / folder
    assert d.is_dir(), f"missing folder: public/data/{folder}"
    have = {p.stem for p in d.glob("*.json")}
    want = set(SITE_IDS)
    assert not want - have, f"public/data/{folder}/ is missing files for: {sorted(want - have)}"
    assert not have - want, f"public/data/{folder}/ has stale files not in data/sites.json: {sorted(have - want)}"


@pytest.mark.parametrize("site_id", SITE_IDS)
def test_hourly_file_shape(site_id):
    name = f"public/data/sites/{site_id}.json"
    d = hourly(site_id)
    assert d["id"] == site_id, f"{name}: id is {d['id']!r}"
    assert d["count"] == COUNT, f"{name}: count is {d['count']}"
    assert d["step_minutes"] == 60, f"{name}: step_minutes is {d['step_minutes']}"
    assert d["start_utc"] == START_UTC, f"{name}: start_utc is {d['start_utc']!r}"
    for key in HOURLY_ARRAYS:
        assert len(d[key]) == d["count"], f"{name}: {key} has {len(d[key])} values, count is {d['count']}"
    for key in ("sun_visible", "earth_visible"):
        assert set(d[key]) <= {0, 1}, f"{name}: {key} has values other than 0 or 1"
    for key in ("sun_az_deg", "earth_az_deg"):
        assert all(0 <= a <= 360 for a in d[key]), f"{name}: {key} outside 0..360"
    assert d["horizon"]["az_step_deg"] == 1, f"{name}: horizon.az_step_deg is not 1"
    assert len(d["horizon"]["elev_deg"]) == 360, f"{name}: horizon.elev_deg does not have 360 values"


@pytest.mark.parametrize("site_id", SITE_IDS)
def test_summary_file_shape(site_id):
    name = f"public/data/summary/{site_id}.json"
    s = summary(site_id)
    assert s["id"] == site_id, f"{name}: id is {s['id']!r}"
    days = s["days"]
    assert len(days) == 365, f"{name}: {len(days)} days, expected 365"
    first = date(2027, 1, 1)
    for i, day in enumerate(days):
        want = (first + timedelta(days=i)).isoformat()
        assert day["date"] == want, f"{name}: day {i} is {day['date']}, expected {want}"
        assert 0 <= day["sun_hours"] <= 24, f"{name}: {want} sun_hours {day['sun_hours']}"
        assert 0 <= day["earth_hours"] <= 24, f"{name}: {want} earth_hours {day['earth_hours']}"
        assert isinstance(day["max_sun_elev_deg"], (int, float)), f"{name}: {want} max_sun_elev_deg not a number"
        assert day["longest_sun_gap_hours"] >= 0, f"{name}: {want} longest_sun_gap_hours negative"
    assert days[-1]["date"] == "2027-12-31", f"{name}: last day is {days[-1]['date']}"


@pytest.mark.parametrize("body", ["sun", "earth"])
@pytest.mark.parametrize("site_id", SITE_IDS)
def test_summary_hours_match_hourly_visibility(site_id, body):
    h = hourly(site_id)[f"{body}_visible"]
    days = summary(site_id)["days"]
    # (step is 60 minutes, so 24 samples per UTC day)
    for i, day in enumerate(days):
        visible = sum(h[i * 24:(i + 1) * 24])
        assert day[f"{body}_hours"] == visible, (
            f"public/data/summary/{site_id}.json {day['date']}: {body}_hours "
            f"{day[f'{body}_hours']} != {visible} visible hours in public/data/sites/{site_id}.json"
        )
    total = sum(d[f"{body}_hours"] for d in days)
    assert total == sum(h), (
        f"public/data/summary/{site_id}.json: yearly {body}_hours {total} != {sum(h)} in public/data/sites/{site_id}.json"
    )


def test_ephemeris_file():
    e = load(PUBLIC / "ephemeris.json")
    name = "public/data/ephemeris.json"
    assert e["count"] == COUNT, f"{name}: count is {e['count']}"
    for key in EPHEMERIS_ARRAYS:
        assert len(e[key]) == COUNT, f"{name}: {key} has {len(e[key])} values"
    bad = [v for v in e["earth_distance_km"] if not 350000 <= v <= 410000]
    assert not bad, f"{name}: earth_distance_km has {len(bad)} values outside 350000..410000"


@pytest.mark.parametrize("site", SITES, ids=SITE_IDS)
def test_source_site_fields(site):
    name = f"data/sites.json ({site.get('id')})"
    for key in ("id", "name", "lat", "lon", "elevation_m", "source"):
        assert key in site, f"{name}: missing key {key!r}"
    assert -90 <= site["lat"] <= -80, f"{name}: lat {site['lat']} not in -90..-80"
    assert -180 <= site["lon"] <= 180, f"{name}: lon {site['lon']} not in -180..180"
