// The sources and the published check the homepage shows.

// The outside pages the method section links to.
export const SOURCE_LINKS = [
  {
    href: "https://ssd.jpl.nasa.gov/horizons/",
    label: "NASA/JPL Horizons",
    note: "where the Sun and Earth are, hour by hour",
  },
  {
    href: "https://trek.nasa.gov/moon/",
    label: "LRO LOLA terrain, from NASA Moon Trek",
    note: "the shape of the ground at the south pole",
  },
  {
    href: "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html",
    label: "NASA NSSDCA table of spacecraft on the Moon",
    note: "coordinates of the past landings",
  },
  {
    href: "https://lroc.im-ldi.com/images/1401",
    label: "LROC page for the IM-2 landing site",
    note: "the IM-2 coordinates",
  },
  {
    href: "https://pgda.gsfc.nasa.gov/products/90",
    label: "NASA PGDA, LOLA map of permanent shadow (Barker et al. 2023)",
    note: "the permanently shadowed regions we measure distance to",
  },
  {
    href: "https://doi.org/10.1016/j.icarus.2014.08.013",
    label: "Glaser et al. 2014, Icarus 243",
    note: "the published sunlight figure we compare with",
  },
  {
    href: "https://elib.dlr.de/94242",
    label: "Glaser et al. 2014, EPSC abstract",
    note: "the coordinates of the four spots we check",
  },
  {
    href: "https://github.com/nitrimandylis/moon-from-earth",
    label: "Source code and data",
    note: "everything behind this page",
  },
];

// Our Sun % against Glaser et al. 2014, copied from data/KNOWN-ANSWERS.md.
export const GLASER_CHECKS = [
  { point: "Connecting Ridge, our best point", height: "2 m", ours: "91.26", glaser: "92.27", difference: "-1.01" },
  { point: "Glaser spot 4", height: "10 m", ours: "95.97", glaser: "95.66", difference: "+0.31" },
  { point: "Glaser spot 3", height: "10 m", ours: "95.95", glaser: "95.6", difference: "+0.35" },
  { point: "Glaser spot 2", height: "2 m", ours: "86.66", glaser: "92.3", difference: "-5.64" },
  { point: "Glaser spot 1", height: "2 m", ours: "83.92", glaser: "92", difference: "-8.08" },
];
