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


def test_min_range_ignores_nearer_terrain():
    g = grid()
    g[:, 250:260] = 100.0  # wall 500-600 m east
    near_and_far = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500)
    far_only = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500, min_range_m=1000)
    assert az(near_and_far, 90) > 5.0
    assert az(far_only, 90) < 0.0


def test_site_height_override():
    g = grid()
    g[:, 300:] = 100.0
    plain = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500)
    standing_on_a_hill = hm.horizon_profile(g, 200, 200, PIXEL, max_range_m=1500, site_height_m=60.0)
    assert az(standing_on_a_hill, 90) < az(plain, 90)


def flat(deg=0.0):
    return hm.Horizon(np.arange(360.0), np.full(360, deg), np.zeros(360))


def test_angular_radii_match_known_sizes():
    # The Sun from 1 au: asin(695,700 / 149,597,870.7) = 0.2664 degrees (about 16 arcminutes).
    assert abs(hm.sun_angular_radius_deg() - 0.2664) < 0.0005
    # Earth from the Moon at its mean distance, 384,400 km: asin(6378.137 / 384400) = 0.951 degrees,
    # so Earth looks about 1.9 degrees wide.
    assert abs(float(hm.earth_angular_radius_deg(384_400.0)) - 0.951) < 0.001
    near, far = hm.earth_angular_radius_deg(np.array([357_000.0, 407_000.0]))
    assert near > far


def test_sunrise_is_when_the_top_edge_clears_the_horizon():
    r = hm.sun_angular_radius_deg()
    az = np.array([90.0, 90.0, 90.0])
    el = np.array([-r + 0.01, -r - 0.01, 0.5])  # top edge just up, just down, well up
    assert hm.disc_visible_mask(flat(), az, el, r).tolist() == [True, False, True]


def test_disc_shows_beside_a_narrow_ridge():
    # A 5 degree ridge exactly at azimuth 90 (one degree wide), nothing around it.
    elev = np.zeros(360)
    elev[89:92] = 5.0
    h = hm.Horizon(np.arange(360.0), elev, np.zeros(360))
    az, el = np.array([90.0]), np.array([1.0])
    assert not hm.disc_visible_mask(h, az, el, 0.27)[0]  # small disc: hidden by the ridge
    assert hm.disc_visible_mask(h, az, el, 3.0)[0]  # wide disc: its sides show past the ridge
    assert not hm.visible_mask(h, az, el)[0]  # the centre alone is hidden


def test_disc_radius_can_differ_per_sample():
    az, el = np.array([0.0, 0.0]), np.array([-0.5, -0.5])
    out = hm.disc_visible_mask(flat(), az, el, np.array([0.3, 1.0]))
    assert out.tolist() == [False, True]
