# Presentation draft

Status: outline and speaker notes for the planned product. On 14 November 2026, the inspected app still showed the Next.js starter screen. Replace every bracketed field with verified results before presenting. A three-minute rehearsal target is a working choice, not a confirmed event rule.

## One-sentence explanation

Lunar Navigator is designed to help people compare lunar south pole sites and dates by showing predicted sunlight and direct visibility of Earth.

## Slide 1 — A landing site also needs the right time

On screen:
- Sunlight matters for a solar-powered mission.
- A direct view of Earth matters for direct communications.
- Compare both over the same mission window.

Speaker notes:
"Choosing a lunar landing site means asking more than where to land. We also need to ask when. Our project focuses on two practical questions: when could a site receive sunlight, and when could it have a direct view of Earth? We want to make those conditions easier to compare."

Visual: a team-made illustration or a properly credited lunar image. Do not use an illustration as evidence of calculated conditions.

## Slide 2 — One comparison view

On screen:
- Select a time range.
- Compare sites in separate sunlight and Earth-visibility lanes.
- Inspect the changes over time.

Speaker notes:
"Our planned interface puts the sites beside one another. Each site has two lanes: one for sunlight and one for Earth visibility. A user can change the date range and see how the comparison changes. The aim is to make the trade-off understandable to a planner while keeping the basic view readable for a student."

Visual: use an actual screenshot when available. Label any design mockup as a mockup.

## Slide 3 — From source data to a clear result

On screen:
- JPL Horizons: positions of solar-system bodies over time.
- LOLA: lunar topography.
- Team processing: visibility estimates for selected sites and times.

Speaker notes:
"JPL Horizons supplies the position information for the Sun and Earth. LOLA provides lunar terrain information. Our proposed processing combines those inputs to estimate whether the Sun or Earth clears a site's surrounding terrain. The website then reads the prepared results."

Before presenting: gio must confirm the exact datasets, coordinates, observer height, time convention, sampling interval, and whether terrain obstruction is actually included. If terrain is absent, explicitly call the result a simplified geometric estimate.

## Slide 4 — Show one real decision

On screen:
- Same mission window, two actual sites.
- Compare sunlight, Earth visibility, and interruptions.
- Change the window and explain one observed difference.

Speaker notes:
"For [UTC START–END], [SITE A] has [VERIFIED RESULT], while [SITE B] has [VERIFIED RESULT]. For a mission prioritising [STATED NEED], this makes [SITE] worth examining further. Changing the window to [SECOND WINDOW] changes [OBSERVED CONDITION]."

Visual: the working app and the exact numbers shown in it. Use a trade-off if no ranking changes; do not invent a dramatic reversal. If only one site works, demonstrate its time variation and disclose the scope.

## Slide 5 — What the comparison can tell us

On screen:
- Helps explore sunlight and direct Earth visibility.
- Shows assumptions and data coverage.
- Further mission analysis is still needed.

Speaker notes:
"This prototype supports an initial comparison. Sunlight availability is not an electrical power calculation, and a direct view of Earth is not a complete radio link analysis. We also do not treat these two measures as proof that a landing is safe. Our next steps depend on what the prototype currently includes: better validation, more sites, and clearer treatment of terrain and uncertainty."

Close:
"The goal is a clear, evidence-based answer to one practical question: how do the conditions at these sites change when the mission date changes?"

## Rehearsal

Use about 25 seconds each for slides 1–3, about 65 seconds for the demonstration, and 30 seconds for limitations and closing. This leaves roughly 10 seconds of margin in a three-minute rehearsal.

These timings belong to an earlier rehearsal draft. Our current submission plan is an English deck of up to seven slides, as described in [deck-reference.md](deck-reference.md); no video or separate local pitch is planned.
