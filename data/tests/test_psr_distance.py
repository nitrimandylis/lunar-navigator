"""psr_distance on a synthetic PSR: a 10 km square with a 2 km square hole, plus a far small one."""

import struct

import numpy as np
import pytest

import psr_distance as P
import terrain


def square(cx, cy, h):
    return np.array([[cx - h, cy - h], [cx - h, cy + h], [cx + h, cy + h], [cx + h, cy - h], [cx - h, cy - h]], float)


POLYS = [[square(0, 0, 5000), square(0, 0, 1000)], [square(50000, 0, 500)]]


def test_inside_is_zero():
    assert P.distance_to_psr_m(3000, 0, POLYS) == 0.0


def test_hole_is_not_psr_and_measures_to_hole_edge():
    assert P.distance_to_psr_m(0, 0, POLYS) == pytest.approx(1000.0)


def test_outside_measures_to_edge_and_corner():
    assert P.distance_to_psr_m(8000, 0, POLYS) == pytest.approx(3000.0)
    assert P.distance_to_psr_m(8000, 9000, POLYS) == pytest.approx(5000.0)


def test_min_area_ignores_small_polygons():
    assert P.distance_to_psr_m(48000, 0, POLYS) == pytest.approx(1500.0)
    assert P.distance_to_psr_m(48000, 0, POLYS, min_area_m2=2e6) == pytest.approx(43000.0)


def test_polygon_area():
    assert P.polygon_area_m2(POLYS[0]) == pytest.approx(100e6 - 4e6)


def test_site_psr_km_rounds_and_uses_ground_scale():
    lat, lon = -85.0, 30.0
    x, y = terrain.lonlat_to_xy(lat, lon)
    polys = [[square(x + 7000, y, 1000)]]
    expect = round(6000 / terrain.scale_factor(lat) / 1000, 2)
    assert P.site_psr_km(lat, lon, polys) == expect


def test_read_shp_polygons_roundtrip(tmp_path):
    ring = square(100, 200, 50)
    pts = ring.astype("<f8").tobytes()
    rec = struct.pack("<i4d2i", 5, 0, 0, 0, 0, 1, len(ring)) + struct.pack("<i", 0) + pts
    body = struct.pack(">2i", 1, len(rec) // 2) + rec
    head = struct.pack(">i20xi", 9994, 0) + struct.pack("<2i8d", 1000, 5, *([0.0] * 8))
    f = tmp_path / "a.shp"
    f.write_bytes(head + body)
    out = P.read_shp_polygons(str(f))
    assert len(out) == 1 and np.allclose(out[0][0], ring)


def test_site_far_from_data_refuses():
    with pytest.raises(ValueError):
        P.site_psr_km(-82.0, 0.0, [[square(0, 0, 10)]])
