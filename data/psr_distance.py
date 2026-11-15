"""Distance from each site to the nearest permanently shadowed region (PSR), from LOLA.

    python data/psr_distance.py shp  <LPSR_80S_20MPP_ADJ_1km2.SHP> --out data/psr_polygons.json
    python data/psr_distance.py sites [--polygons data/psr_polygons.json] [--write]

PSR source: NASA PGDA "A New View of the Lunar South Pole from LOLA" (Barker et al. 2023,
PSJ 4, 183), file LPSR_80S_20MPP_ADJ_1km2.SHP: PSR polygons larger than 1 km2 on the 20 m LOLA
grid, south polar stereographic (true scale at the pole, sphere radius 1,737,400 m: the same
projection as terrain.lonlat_to_xy). `shp` extracts the polygons near our sites into a small
JSON (integer metres); `sites` measures the distance from each site to the nearest polygon edge
(0 when inside a PSR, holes respected) and writes `psr_km` into data/sites.json and
public/data/sites.json. Distances are projection metres divided by the local scale factor
(terrain.scale_factor), so they are ground distances.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
from pathlib import Path

import numpy as np

import terrain

MAX_RADIUS_M = 303_990.0  # polygons file covers +-303.99 km around the pole (about 80 S)
Ring = np.ndarray  # shape (n, 2), x/y metres, closed (first point == last point)


def read_shp_polygons(path: str) -> list[list[Ring]]:
    """Polygons (type 5) of a shapefile, each a list of rings (outer first, then holes)."""
    b = Path(path).read_bytes()
    if struct.unpack(">i", b[:4])[0] != 9994 or struct.unpack("<i", b[32:36])[0] != 5:
        raise ValueError("not a polygon shapefile")
    out, pos = [], 100
    while pos + 8 <= len(b):
        (clen,) = struct.unpack(">i", b[pos + 4 : pos + 8])
        rec = b[pos + 8 : pos + 8 + clen * 2]
        pos += 8 + clen * 2
        stype, = struct.unpack("<i", rec[:4])
        if stype == 0:
            continue
        nparts, npts = struct.unpack("<ii", rec[36:44])
        parts = list(struct.unpack(f"<{nparts}i", rec[44 : 44 + 4 * nparts])) + [npts]
        off = 44 + 4 * nparts
        pts = np.frombuffer(rec, dtype="<f8", count=2 * npts, offset=off).reshape(npts, 2)
        out.append([pts[parts[i] : parts[i + 1]].copy() for i in range(nparts)])
    return out


def _inside(px: float, py: float, ring: Ring) -> bool:
    x0, y0, x1, y1 = ring[:-1, 0], ring[:-1, 1], ring[1:, 0], ring[1:, 1]
    straddle = (y0 > py) != (y1 > py)
    with np.errstate(divide="ignore", invalid="ignore"):
        xc = x0 + (py - y0) * (x1 - x0) / (y1 - y0)
    return bool(np.count_nonzero(straddle & (px < xc)) % 2)


def _edge_distance(px: float, py: float, ring: Ring) -> float:
    a, b = ring[:-1], ring[1:]
    d = b - a
    l2 = np.einsum("ij,ij->i", d, d)
    t = np.where(l2 > 0, np.einsum("ij,ij->i", np.array([px, py]) - a, d) / np.where(l2 > 0, l2, 1), 0.0)
    t = np.clip(t, 0.0, 1.0)
    c = a + t[:, None] * d
    return float(np.min(np.hypot(c[:, 0] - px, c[:, 1] - py)))


def distance_to_psr_m(x: float, y: float, polygons: list[list[Ring]], min_area_m2: float = 0.0) -> float:
    """Projection-metre distance from (x, y) to the nearest PSR polygon edge; 0 inside one."""
    best = math.inf
    for rings in polygons:
        if min_area_m2 and polygon_area_m2(rings) < min_area_m2:
            continue
        if sum(_inside(x, y, r) for r in rings) % 2:  # even-odd: holes are not PSR
            return 0.0
        best = min(best, min(_edge_distance(x, y, r) for r in rings))
    return best


def polygon_area_m2(rings: list[Ring]) -> float:
    def a(r: Ring) -> float:
        return 0.5 * abs(float(np.dot(r[:-1, 0], r[1:, 1]) - np.dot(r[1:, 0], r[:-1, 1])))

    return a(rings[0]) - sum(a(r) for r in rings[1:])


def site_psr_km(lat: float, lon: float, polygons: list[list[Ring]]) -> float:
    x, y = terrain.lonlat_to_xy(lat, lon)
    d = distance_to_psr_m(x, y, polygons)
    if d > 0 and d > MAX_RADIUS_M - math.hypot(x, y):
        raise ValueError("nearest PSR may lie outside the polygon file")
    return round(d / terrain.scale_factor(lat) / 1000.0, 2)


def cmd_shp(args) -> None:
    sites = json.loads(Path(args.sites).read_text())
    pts = [terrain.lonlat_to_xy(s["lat"], s["lon"]) for s in sites]
    polys = read_shp_polygons(args.shp)
    keep = [p for p in polys if min(distance_to_psr_m(x, y, [p]) for x, y in pts) <= args.keep_km * 1000]
    doc = {
        "source": "NASA PGDA, LPSR_80S_20MPP_ADJ_1km2.SHP (Barker et al. 2023, PSJ 4, 183; LOLA)",
        "url": "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LPSR_80S_20MPP_ADJ_1km2.SHP",
        "projection": "south polar stereographic, R=1737400 m, metres",
        "keep_km": args.keep_km,
        "kept": f"polygons with an edge within {args.keep_km} km of any site; {len(keep)} of {len(polys)}",
        "polygons": [[np.rint(r).astype(int).tolist() for r in p] for p in keep],
    }
    Path(args.out).write_text(json.dumps(doc, separators=(",", ":")) + "\n")
    print(doc["kept"])


def load_polygons(path: str) -> list[list[Ring]]:
    doc = json.loads(Path(path).read_text())
    return [[np.array(r, dtype=float) for r in p] for p in doc["polygons"]]


def cmd_sites(args) -> None:
    polys = load_polygons(args.polygons)
    keep_km = json.loads(Path(args.polygons).read_text())["keep_km"]
    here = Path(__file__).parent
    src = here / "sites.json"
    sites = json.loads(src.read_text())
    for s in sites:
        s["psr_km"] = site_psr_km(s["lat"], s["lon"], polys)
        if s["psr_km"] > keep_km:
            raise SystemExit(f"{s['id']}: nearest PSR beyond the {keep_km} km kept in the polygon file; re-run `shp`")
        print(f"{s['id']:28s} {s['lat']:9.4f} {s['lon']:10.4f} {s['psr_km']:8.2f}")
    if args.write:
        src.write_text(json.dumps(sites, indent=2) + "\n")
        pub = here.parent / "public/data/sites.json"
        pub.write_text(json.dumps(sites, separators=(",", ":")) + "\n")


def main() -> None:
    here = Path(__file__).parent
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("shp")
    a.add_argument("shp")
    a.add_argument("--out", default=str(here / "psr_polygons.json"))
    a.add_argument("--sites", default=str(here / "sites.json"))
    a.add_argument("--keep-km", type=float, default=60.0)
    a.set_defaults(fn=cmd_shp)
    b = sub.add_parser("sites")
    b.add_argument("--polygons", default=str(here / "psr_polygons.json"))
    b.add_argument("--write", action="store_true")
    b.set_defaults(fn=cmd_sites)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
