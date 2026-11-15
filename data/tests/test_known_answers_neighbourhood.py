"""Synthetic checks for data/known_answers_neighbourhood.py (no DEM or internet needed)."""

import numpy as np

import known_answers_neighbourhood as kn

# A grid of 5 m pixels with centres at multiples of 5 (origin 0, 0).


def test_disc_10m_around_a_pixel_centre():
    offs = kn.neighbourhood_offsets(0.0, 0.0, 0.0, 0.0, 5.0, "disc", 10.0)
    # Centres within 10 m of a pixel centre: 13 (the centre, 4 at 5 m, 4 diagonals at 7.07, 4 at 10 m).
    assert len(offs) == 13
    assert (0, 0) in offs and (2, 0) in offs and (2, 1) not in offs


def test_square_20m_around_a_pixel_centre_includes_edges():
    offs = kn.neighbourhood_offsets(0.0, 0.0, 0.0, 0.0, 5.0, "square", 10.0)
    assert len(offs) == 25  # |dx|, |dy| <= 10 m: 5 x 5 centres


def test_square_20m_between_pixels_gives_16():
    # Point at a pixel corner (2.5, 2.5): centres within +-10 m are at -7.5 .. 12.5 -> but only
    # -5..10 qualify on each axis: 4 x 4.
    offs = kn.neighbourhood_offsets(2.5, 2.5, 0.0, 0.0, 5.0, "square", 10.0)
    assert len(offs) == 16


def test_summarise_reports_max_and_location():
    s = kn.summarise([80.0, 84.0, 82.0], [(0.0, 0.0), (5.0, -5.0), (-5.0, 0.0)], (1.0, 1.0))
    assert s["max"] == 84.0 and s["pixels"] == 3
    assert s["mean"] == 82.0
    assert (s["max_at_east_m"], s["max_at_north_m"]) == (4.0, -6.0)


def test_sun_percent_flat_horizon():
    from horizon_mask import Horizon

    hor = Horizon(np.arange(360.0), np.zeros(360), np.zeros(360))
    el = np.array([10.0, -10.0, 10.0, -10.0])
    assert kn.sun_percent(hor, np.zeros(4), el, 0.27) == 50.0
