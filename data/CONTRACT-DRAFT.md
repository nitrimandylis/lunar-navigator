# Data contract: DRAFT for trim to review

Proposed by gio. Nothing is final until trim agrees. Once agreed, trim copies it into
`AGENTS.md` (Contract section). Python in `data/` writes these files; the app only reads them.

## Conventions

- Times are UTC, ISO 8601 (`2027-03-01T00:00:00Z`).
- Angles are degrees. Elevation is height above a smooth Moon (flat horizon = 0).
- Azimuth is measured clockwise from north, 0 to 360.
- A body is **visible** at an hour when its elevation is above the terrain horizon at that
  azimuth.

## File 1: `sites.json`

The list of landing sites.

```json
[
  {
    "id": "shackleton-rim",
    "name": "Shackleton Crater rim",
    "lat": -89.9,
    "lon": 0.0,
    "elevation_m": 1500,
    "source": "where the coordinates came from"
  }
]
```

## File 2: `sites/<id>.json` (one per site)

Hourly series are plain arrays (not one object per hour) to keep files small. Index `i` in
every array is the same hour: `start_utc + i * step_minutes`.

```json
{
  "id": "shackleton-rim",
  "start_utc": "2027-01-01T00:00:00Z",
  "step_minutes": 60,
  "count": 8760,
  "sun_elev_deg": [0.4, 0.6],
  "sun_az_deg": [12.1, 13.0],
  "earth_elev_deg": [3.2, 3.1],
  "earth_az_deg": [201.5, 201.4],
  "sun_visible": [1, 1],
  "earth_visible": [1, 1],
  "horizon": {
    "az_step_deg": 1,
    "elev_deg": [0.8, 0.7]
  }
}
```

- `horizon.elev_deg` has 360 values: terrain height angle for azimuth 0, 1, 2, ... 359.
- `sun_visible` and `earth_visible` are 1 or 0, already computed, so the app does not have to
  redo the comparison.

## File 3: `summary/<id>.json` (one per site, per-day totals)

For the site-by-day grid (power lane and comms lane).

```json
{
  "id": "shackleton-rim",
  "days": [
    {
      "date": "2027-01-01",
      "sun_hours": 18.0,
      "earth_hours": 9.0,
      "max_sun_elev_deg": 1.6,
      "longest_sun_gap_hours": 4.0
    }
  ]
}
```

## Open questions for trim

1. Which date range? Proposal: one full year to start. More = bigger files.
2. Does the app want `sites/<id>.json` and `summary/<id>.json` as two files, or one?
3. Where should the app find them? Proposal: `data/out/`, and trim copies or imports them.
   If it should be `public/data/`, trim decides, since `public/` is not in `data/`.
4. Is 60 minute steps fine, or does the timeline need finer?
5. Anything else the UI needs per hour (for example time to next sunset)? Proposal: the app
   works that out from `sun_visible`.
