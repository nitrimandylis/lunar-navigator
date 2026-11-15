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

# 2027 lives directly in public/data/; later years in public/data/<year>/ (same layout inside).
YEARS = [2027, 2028, 2029, 2030]


def year_dir(year):
    return PUBLIC if year == 2027 else PUBLIC / str(year)


def rel(path):
    return path.relative_to(ROOT).as_posix()


def n_days(year):
    return (date(year + 1, 1, 1) - date(year, 1, 1)).days


def n_hours(year):
    return 24 * n_days(year)


CASES = [(y, sid) for y in YEARS for sid in [s["id"] for s in json.loads(SITES_SRC.read_text(encoding="utf-8"))]]
CASE_IDS = [f"{y}-{sid}" for y, sid in CASES]
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


def hourly(year, site_id):
    return cached(year_dir(year) / "sites" / f"{site_id}.json")


def summary(year, site_id):
    return cached(year_dir(year) / "summary" / f"{site_id}.json")


def test_public_sites_json_matches_source():
    public = load(PUBLIC / "sites.json")
    assert public == SITES, "public/data/sites.json differs from data/sites.json: re-run data/build.py"


@pytest.mark.parametrize("folder", ["sites", "summary"])
@pytest.mark.parametrize("year", YEARS)
def test_one_file_per_site_and_no_stale_files(year, folder):
    d = year_dir(year) / folder
    assert d.is_dir(), f"missing folder: {rel(d)}"
    have = {p.stem for p in d.glob("*.json")}
    want = set(SITE_IDS)
    assert not want - have, f"{rel(d)}/ is missing files for: {sorted(want - have)}"
    assert not have - want, f"{rel(d)}/ has stale files not in data/sites.json: {sorted(have - want)}"


@pytest.mark.parametrize("year", YEARS[1:])
def test_extra_year_folder_has_only_expected_entries(year):
    names = {p.name for p in year_dir(year).iterdir()}
    assert names == {"sites", "summary", "ephemeris.json"}, f"public/data/{year}/ has {sorted(names)}"


@pytest.mark.parametrize("year,site_id", CASES, ids=CASE_IDS)
def test_hourly_file_shape(year, site_id):
    name = rel(year_dir(year) / "sites" / f"{site_id}.json")
    d = hourly(year, site_id)
    assert d["id"] == site_id, f"{name}: id is {d['id']!r}"
    assert d["count"] == n_hours(year), f"{name}: count is {d['count']}, expected {n_hours(year)}"
    assert d["step_minutes"] == 60, f"{name}: step_minutes is {d['step_minutes']}"
    assert d["start_utc"] == f"{year}-01-01T00:00:00Z", f"{name}: start_utc is {d['start_utc']!r}"
    for key in HOURLY_ARRAYS:
        assert len(d[key]) == d["count"], f"{name}: {key} has {len(d[key])} values, count is {d['count']}"
    for key in ("sun_visible", "earth_visible"):
        assert set(d[key]) <= {0, 1}, f"{name}: {key} has values other than 0 or 1"
    for key in ("sun_az_deg", "earth_az_deg"):
        assert all(0 <= a <= 360 for a in d[key]), f"{name}: {key} outside 0..360"
    assert d["horizon"]["az_step_deg"] == 1, f"{name}: horizon.az_step_deg is not 1"
    assert len(d["horizon"]["elev_deg"]) == 360, f"{name}: horizon.elev_deg does not have 360 values"


@pytest.mark.parametrize("year,site_id", CASES, ids=CASE_IDS)
def test_summary_file_shape(year, site_id):
    name = rel(year_dir(year) / "summary" / f"{site_id}.json")
    s = summary(year, site_id)
    assert s["id"] == site_id, f"{name}: id is {s['id']!r}"
    days = s["days"]
    assert len(days) == n_days(year), f"{name}: {len(days)} days, expected {n_days(year)}"
    first = date(year, 1, 1)
    for i, day in enumerate(days):
        want = (first + timedelta(days=i)).isoformat()
        assert day["date"] == want, f"{name}: day {i} is {day['date']}, expected {want}"
        assert 0 <= day["sun_hours"] <= 24, f"{name}: {want} sun_hours {day['sun_hours']}"
        assert 0 <= day["earth_hours"] <= 24, f"{name}: {want} earth_hours {day['earth_hours']}"
        assert 0 <= day["both_hours"] <= min(day["sun_hours"], day["earth_hours"]), f"{name}: {want} both_hours {day['both_hours']}"
        assert isinstance(day["max_sun_elev_deg"], (int, float)), f"{name}: {want} max_sun_elev_deg not a number"
        assert day["longest_sun_gap_hours"] >= 0, f"{name}: {want} longest_sun_gap_hours negative"
    assert days[-1]["date"] == f"{year}-12-31", f"{name}: last day is {days[-1]['date']}"


@pytest.mark.parametrize("year,site_id", CASES, ids=CASE_IDS)
def test_summary_both_hours_match_hourly_visibility(year, site_id):
    h = hourly(year, site_id)
    both = [s & e for s, e in zip(h["sun_visible"], h["earth_visible"])]
    for i, day in enumerate(summary(year, site_id)["days"]):
        assert day["both_hours"] == sum(both[i * 24:(i + 1) * 24]), (
            f"{year} {site_id} {day['date']}: both_hours {day['both_hours']} is wrong"
        )


@pytest.mark.parametrize("body", ["sun", "earth"])
@pytest.mark.parametrize("year,site_id", CASES, ids=CASE_IDS)
def test_summary_hours_match_hourly_visibility(year, site_id, body):
    h = hourly(year, site_id)[f"{body}_visible"]
    days = summary(year, site_id)["days"]
    # (step is 60 minutes, so 24 samples per UTC day)
    for i, day in enumerate(days):
        visible = sum(h[i * 24:(i + 1) * 24])
        assert day[f"{body}_hours"] == visible, (
            f"{year} {site_id} {day['date']}: {body}_hours {day[f'{body}_hours']} != {visible} visible hours in the hourly file"
        )
    total = sum(d[f"{body}_hours"] for d in days)
    assert total == sum(h), f"{year} {site_id}: yearly {body}_hours {total} != {sum(h)} in the hourly file"


@pytest.mark.parametrize("year", YEARS)
def test_ephemeris_file(year):
    path = year_dir(year) / "ephemeris.json"
    e = load(path)
    name = rel(path)
    assert e["count"] == n_hours(year), f"{name}: count is {e['count']}, expected {n_hours(year)}"
    for key in EPHEMERIS_ARRAYS:
        assert len(e[key]) == e["count"], f"{name}: {key} has {len(e[key])} values"
    bad = [v for v in e["earth_distance_km"] if not 350000 <= v <= 410000]
    assert not bad, f"{name}: earth_distance_km has {len(bad)} values outside 350000..410000"


@pytest.mark.parametrize("year", YEARS)
def test_ephemeris_matches_site_start(year):
    e = load(year_dir(year) / "ephemeris.json")
    assert e["start_utc"] == f"{year}-01-01T00:00:00Z"


@pytest.mark.parametrize("site", SITES, ids=SITE_IDS)
def test_source_site_fields(site):
    name = f"data/sites.json ({site.get('id')})"
    for key in ("id", "name", "lat", "lon", "elevation_m", "source"):
        assert key in site, f"{name}: missing key {key!r}"
    assert -90 <= site["lat"] <= -80, f"{name}: lat {site['lat']} not in -90..-80"
    assert -180 <= site["lon"] <= 180, f"{name}: lon {site['lon']} not in -180..180"
    if "mission" in site:
        assert isinstance(site["mission"], str) and site["mission"], f"{name}: mission must be a non-empty string"
