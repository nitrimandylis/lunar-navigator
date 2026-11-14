import math

import numpy as np

import horizon_mask as hm

PIXEL = 10.0  # metres per pixel


def grid(size=401):
    return np.zeros((size, size))


def az(h, degrees):
    return h.elev_deg[int(round(degrees / (h.az_deg[1] - h.az_deg[0]))) % len(h.az_deg)]


def test_flat_ground_horizon_is_level():
    h = hm.horizon_profile(grid(), 200, 200, PIXEL, max_range_m=1500)
    # On a sphere flat ground drops away, so the horizon is a hair below 0.
    assert np.all(h.elev_deg <= 0.0)
    assert np.all(h.elev_deg > -0.01)


def test_wall_to_the_east_matches_hand_calculation():
    # A 100 m wall, 1000 m east. Angle = atan(H/D) minus the Moon's curvature drop D/(2R).
    g = grid()
    g[:, 200 + 100 :] = 100.0  # starts 100 pixels = 1000 m east
    h = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500)
    expected = math.degrees(math.atan(100 / 1000) - 1000 / (2 * hm.MOON_RADIUS_M))
    assert abs(az(h, 90) - expected) < 0.005  # about 5.69 degrees
    assert az(h, 270) < 0.0  # nothing to the west


def test_north_rotation_moves_the_wall():
    g = grid()
    g[:, 300:] = 100.0  # wall to the right in the image
    # If local north points to the right of the image, the wall is at azimuth 0.
    h = hm.horizon_profile(g, 200, 200, PIXEL, north_deg=90, max_range_m=1500)
    assert az(h, 0) > 5.0
    assert az(h, 90) < 0.0


def test_highest_angle_wins():
    g = grid()
    g[:, 210:215] = 5.0  # near and low: atan(5/100) = 2.86 deg
    g[:, 400:] = 100.0  # far and tall: atan(100/2000) = 2.86 deg minus curvature, so lower
    h = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=2000)
    near = math.degrees(math.atan(5 / 100) - 100 / (2 * hm.MOON_RADIUS_M))
    assert abs(az(h, 90) - near) < 0.01


def test_standing_higher_lowers_the_horizon():
    g = grid()
    g[:, 300:] = 100.0
    low = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500)
    high = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500, observer_height_m=50)
    assert az(high, 90) < az(low, 90)


def test_ray_stops_at_the_grid_edge():
    g = grid(101)
    h = hm.horizon_profile(g, 50, 90, PIXEL, max_range_m=5000)
    assert h.reach_m[90] == 9 * PIXEL  # only 9 whole pixels fit to the east
    assert h.reach_m[270] > h.reach_m[90]  # lots of room to the west


def test_max_range_limits_the_search():
    g = grid()
    g[:, 350:] = 500.0  # 1500 m away
    h = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1000)
    assert az(h, 90) < 0.0


def test_is_visible_compares_with_the_horizon():
    g = grid()
    g[:, 300:] = 100.0
    h = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500)
    assert hm.is_visible(h, 90, 10.0)  # above the 5.7 degree wall
    assert not hm.is_visible(h, 90, 3.0)  # behind it
    assert hm.is_visible(h, 270, 0.5)  # clear sky to the west
