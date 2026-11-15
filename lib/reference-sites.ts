// Real past landings outside the south polar terrain data, for comparison with
// the polar sites. Their Sun and Earth angles are worked out in the browser on
// a smooth Moon (no terrain), the same way as custom points. Away from the
// poles the Sun climbs high, so terrain matters much less than at the pole.
//
// Coordinates: NASA NSSDCA, "Table of Anthropogenic Impacts and Spacecraft on
// the Moon", https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html
// (read 14 November 2026). Longitude is east-positive.

import type { Site } from "./data.ts";

const SOURCE_NOTE =
  "Landing coordinates from the NASA NSSDCA Table of Anthropogenic Impacts and " +
  "Spacecraft on the Moon (https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html). " +
  "Smooth Moon, no terrain; Sun and Earth hours are for 2027 to 2030.";

export const REFERENCE_SITES: Site[] = [
  {
    id: "ref-apollo-11",
    name: "Apollo 11, Mare Tranquillitatis",
    mission: "NASA 1969",
    lat: 0.67416,
    lon: 23.47314,
    elevation_m: 0,
    source: SOURCE_NOTE,
  },
  {
    id: "ref-blue-ghost-1",
    name: "Blue Ghost 1, Mare Crisium",
    mission: "CLPS 2025",
    lat: 18.562,
    lon: 61.81,
    elevation_m: 0,
    source: SOURCE_NOTE,
  },
  {
    id: "ref-slim",
    name: "SLIM, near Shioli crater",
    mission: "JAXA 2024",
    lat: -13.316,
    lon: 25.251,
    elevation_m: 0,
    source: SOURCE_NOTE,
  },
  {
    id: "ref-chandrayaan-3",
    name: "Chandrayaan-3, Shiv Shakti point",
    mission: "ISRO 2023",
    lat: -69.3741,
    lon: 32.32,
    elevation_m: 0,
    source: SOURCE_NOTE,
  },
  {
    // The table gives 153.9852 W, which is -153.9852 east-positive.
    id: "ref-change-6",
    name: "Chang'e 6, far side",
    mission: "CNSA 2024",
    lat: -41.6385,
    lon: -153.9852,
    elevation_m: 0,
    source: SOURCE_NOTE,
  },
];
