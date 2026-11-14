"""Plausibility check of our illumination numbers against a published value.

Glaser et al. 2014 (Icarus 243, 78, https://elib.dlr.de/94242) report that the Connecting
Ridge between Shackleton and de Gerlache is 92.27% sunlit at 2 m above ground (95.65% at
10 m), over 19 years.

This is a plausibility check, not a replication:
- The paper's best point has no readable latitude/longitude, so we cannot compute the same
  spot. We compare the best-lit point we found by scanning the ridge (site `connecting-ridge`).
- The paper covers 19 years; we cover the single year 2027.
- Whether the paper treats the Sun as a point at its centre or as a disc is unconfirmed; ours
  counts the Sun as visible when any part of its disc is above the horizon.

So the tolerance is deliberately loose (+/-10 points). No terrain files or internet needed:
this only reads the committed site file.
"""

import json
from pathlib import Path

import terrain

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "public" / "data" / "sites" / "connecting-ridge.json"

GLASER_2014_PERCENT_2M = 92.27
TOLERANCE_POINTS = 10.0


def test_observer_height_matches_paper():
    assert terrain.DEFAULT_OBSERVER_HEIGHT_M == 2.0


def test_connecting_ridge_sunlit_percent_near_glaser_2014():
    series = json.loads(SITE.read_text())
    visible = series["sun_visible"]
    percent = 100.0 * sum(visible) / len(visible)
    assert abs(percent - GLASER_2014_PERCENT_2M) <= TOLERANCE_POINTS, percent
