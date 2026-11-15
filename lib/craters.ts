// The named craters the maps draw: the map in the tool and the relief on the
// homepage.

import type { LabelSide } from "./map.ts";

export type Crater = {
  name: string;
  lat: number;
  lon: number;
  diameterKm: number;
  labelSide: LabelSide;
};

// Craters near the curated sites, for context.
// Names, centres and diameters from the IAU Gazetteer of Planetary
// Nomenclature (https://planetarynames.wr.usgs.gov), checked 2026-11-14.
// data/rim_search.py lists the same craters with centres rounded a little
// differently; these are the Gazetteer's own values.
// labelSide says where the name goes, so names near the pole do not overlap.
export const CRATERS: Crater[] = [
  { name: "Shackleton", lat: -89.67, lon: 129.78, diameterKm: 20.92, labelSide: "right" },
  { name: "de Gerlache", lat: -88.48, lon: -88.34, diameterKm: 32.71, labelSide: "left" },
  { name: "Haworth", lat: -87.45, lon: -5.17, diameterKm: 51.42, labelSide: "left" },
  { name: "Faustini", lat: -87.18, lon: 84.31, diameterKm: 42.48, labelSide: "above" },
  { name: "Malapert", lat: -85.0, lon: 11.4, diameterKm: 72.38, labelSide: "above" },
  { name: "Nobile", lat: -85.28, lon: 53.27, diameterKm: 79.27, labelSide: "right" },
  { name: "Amundsen", lat: -84.44, lon: 83.07, diameterKm: 103.39, labelSide: "below" },
  { name: "Cabeus", lat: -85.33, lon: -42.13, diameterKm: 100.58, labelSide: "left" },
  { name: "Sverdrup", lat: -88.32, lon: -153.39, diameterKm: 32.83, labelSide: "below" },
  { name: "Slater", lat: -88.08, lon: 111.29, diameterKm: 25.12, labelSide: "right" },
];
