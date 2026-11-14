// The guided tour: five steps that walk a new visitor through one story, two
// places about 2 km apart with opposite lighting. Each step says which panel
// to look at and puts the page in the state the text talks about.
//
// The numbers in the text are real. lib/tour.test.ts recomputes each one from
// public/data and fails if the text and the data ever disagree.

// The part of the page a step points at.
export type TourTarget = "sites" | "selected" | "months";

export type TourStep = {
  title: string;
  text: string;
  target: TourTarget;
  // The site the step selects.
  siteId: string;
  // The month the step shows. 0 = January.
  month: number;
  // True when the step runs time forward.
  isPlaying: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    title: "Power and comms at a glance",
    text:
      "Each row is a place near the Moon's south pole. Orange squares are days with " +
      "sunlight, for power. Blue squares are days with Earth in view, for radio. " +
      "The best rows for this month are at the top.",
    target: "sites",
    siteId: "connecting-ridge",
    month: 0,
    isPlaying: false,
  },
  {
    title: "2 km apart, opposite fates",
    text:
      "The lit ridge near Shackleton has the Sun for all 744 hours of January. The " +
      "shadowed ground 2.1 km away, at the bottom of the list, has it for 0 hours. " +
      "Both rows carry a pair tag.",
    target: "sites",
    siteId: "shackleton-ridge",
    month: 0,
    isPlaying: false,
  },
  {
    title: "Why: look at the sky",
    text:
      "This is the shadowed place. The ground rises 15 to 20 degrees all the way " +
      "round, and the Sun never climbs more than about 2 degrees. Time is running " +
      "now: watch the Sun travel behind the crater wall without ever clearing it.",
    target: "selected",
    siteId: "shackleton-shadow",
    month: 0,
    isPlaying: true,
  },
  {
    title: "Change the date, change the answer",
    text:
      "A slipped launch date means a different month. In May the same lit ridge has " +
      "the Sun for 512 of 744 hours, with one dark spell of 162 hours. The month " +
      "buttons at the top make that comparison one click.",
    target: "months",
    siteId: "shackleton-ridge",
    month: 4,
    isPlaying: false,
  },
  {
    title: "Compare with Apollo 11",
    text:
      "Near the equator the pattern is simple: about two weeks of daylight, then " +
      "two weeks of night, with Earth always high in the sky. The pole is nothing " +
      "like that. Now explore: pick any site, any month, or add a point of your own.",
    target: "selected",
    siteId: "ref-apollo-11",
    month: 0,
    isPlaying: true,
  },
];
