"""sun_pct_10m.py on synthetic terrain: no DEM files, no internet."""

import numpy as np

import sun_pct_10m as m
from horizon_mask import Horizon, horizon_profile, sun_angular_radius_deg


def flat_horizon(elev: float) -> Horizon:
    az = np.arange(360.0)
    return Horizon(az, np.full(360, elev), np.zeros(360))


def test_percent_rounds_to_one_decimal():
    v = np.zeros(35064, dtype=bool)
    v[:12345] = True
    assert m.percent(v) == round(100 * 12345 / 35064, 1) == 35.2
    assert m.percent(np.zeros(10, dtype=bool)) == 0.0
    assert m.percent(np.ones(10, dtype=bool)) == 100.0


def test_disc_rule_counts_top_edge():
    # Centre 0.1 deg below a flat horizon at 0: the disc (radius ~0.267 deg) still pokes out.
    r = sun_angular_radius_deg()
    assert 0.1 < r
    h = flat_horizon(0.0)
    vis = m.visible_hours(h, np.array([10.0, 10.0]), np.array([-0.1, -r - 0.05]))
    assert vis.tolist() == [True, False]


def test_taller_observer_never_sees_less_on_synthetic_wall():
    # A 20 m wall of terrain 100 m east of the observer on otherwise flat ground.
    n = 201
    grid = np.zeros((n, n))
    grid[:, 120:] = 20.0
    c = 100.0
    h2 = horizon_profile(grid, c, c, 10.0, max_range_m=900.0, observer_height_m=2.0)
    h10 = horizon_profile(grid, c, c, 10.0, max_range_m=900.0, observer_height_m=10.0)
    assert np.all(h10.elev_deg <= h2.elev_deg + 1e-9)
    assert h10.elev_deg[90] < h2.elev_deg[90]  # due east, the wall: 18 m vs 10 m above the eye, 200 m away
    az = np.full(360, 90.0)
    el = np.linspace(-1.0, 8.0, 360)
    v2, v10 = m.visible_hours(h2, az, el), m.visible_hours(h10, az, el)
    assert v10.sum() > v2.sum()
    assert np.all(v10 >= v2)
    assert m.percent(v10) >= m.percent(v2)


def test_site_percent_reads_year_files(tmp_path):
    import json

    for year, sub in [(2027, ""), (2028, "2028"), (2029, "2029"), (2030, "2030")]:
        d = tmp_path / sub / "sites"
        d.mkdir(parents=True)
        # 2 hours per year: one clearly up, one clearly down
        (d / "x.json").write_text(json.dumps({"sun_az_deg": [0.0, 0.0], "sun_elev_deg": [5.0, -5.0], "sun_visible": [1, 0]}))
    pct, n, total = m.site_percent(flat_horizon(0.0), "x", public=tmp_path)
    assert (n, total, pct) == (4, 8, 50.0)
    assert m.committed_percent("x", public=tmp_path) == 50.0
