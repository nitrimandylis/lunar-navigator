import json

import numpy as np
import pytest

import repick_pair as rp


def pt(x, y, sun, earth):
    return {"x": x, "y": y, "lat": -89.4, "lon": 10.0, "sun_hours": sun, "earth_hours": earth, "both_hours": 0.0}


def test_to_python_makes_numpy_values_json_safe():
    data = {"n": np.int64(3), "f": np.float32(1.5), "b": np.bool_(True), "a": np.arange(3), "t": (np.int64(1), 2), np.int64(7): "k"}
    with pytest.raises(TypeError):
        json.dumps({"n": np.int64(3)})  # the original crash
    out = rp.to_python(data)
    assert json.loads(json.dumps(out)) == {"n": 3, "f": 1.5, "b": True, "a": [0, 1, 2], "t": [1, 2], "7": "k"}


def test_separation_is_euclidean():
    assert rp.separation_m(pt(0, 0, 0, 0), pt(3000, 4000, 0, 0)) == 5000.0


def test_best_lit_prefers_sun_then_earth():
    pts = [pt(0, 0, 100, 5), pt(1, 0, 200, 1), pt(2, 0, 200, 9)]
    assert rp.best_lit(pts)["x"] == 2
    with pytest.raises(ValueError):
        rp.best_lit([])


def test_dark_candidates_respect_separation_range():
    lit = pt(0, 0, 8000, 5000)
    pts = [pt(1000, 0, 0, 9), pt(3000, 0, 0, 1), pt(7000, 0, 0, 9)]
    assert [s["x"] for s, _ in rp.dark_candidates(pts, lit, 2000, 6000)] == [3000]
    with pytest.raises(ValueError):
        rp.best_dark(pts, lit, 4000, 5000)


def test_best_dark_orders_by_sun_then_fewest_earth_then_gap():
    lit = pt(0, 0, 8000, 5000)
    pts = [
        pt(5000, 0, 0, 0),  # 0 Sun, 0 Earth, farther
        pt(3000, 0, 0, 0),  # 0 Sun, 0 Earth, nearer: wins the tie
        pt(2500, 0, 0, 4),  # no Sun but some Earth: loses to 0/0
        pt(2200, 0, 30, 0),  # some Sun loses to any fully dark point
    ]
    dark, sep = rp.best_dark(pts, lit, 2000, 6000)
    assert dark["x"] == 3000 and sep == 3000.0
    assert [s["x"] for s, _ in rp.dark_candidates(pts, lit, 2000, 6000)] == [3000, 5000, 2500, 2200]


def test_describe_is_rounded_json_safe_and_drops_xy():
    s = {"x": 1.0, "y": 2.0, "lat": np.float64(-89.438654321), "lon": np.float64(222.500112), "sun_hours": np.float64(7936.04), "earth_hours": 4000.0, "both_hours": np.float64(3900.0)}
    d = rp.describe(s, np.float32(1960.4))
    assert "x" not in d and d["lat"] == -89.43865 and d["elevation_m"] == 1960 and d["sun_hours"] == 7936.0
    json.dumps(d)
