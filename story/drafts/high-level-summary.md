# High-level summary - working draft

> **DRAFT - preparation only. Not approved for submission.**

Updated: 14 November 2026, following Nick's feature-status clarification.
Only the text between **DRAFT TEXT - START** and **END OF DRAFT TEXT** is proposed submission wording. All sources, questions and editorial guidance are in the clearly separated team-notes section below. [PROJECT NAME] remains a placeholder.

---

## DRAFT TEXT - START

Where on the Moon is sunlight available, and when is Earth visible? [PROJECT NAME] is a prototype website being developed to help educators, the public and mission planners explore those questions across lunar south pole locations and dates. Users can select a site, enter exact coordinates or click the lunar map to choose a location, and change the date.

Its 18 prepared points combine NASA/JPL Horizons Sun and Earth positions with terrain horizons derived from LRO LOLA elevation data accessed through NASA Moon Trek. The results show why timing matters: a computed ridge near Shackleton has sunlight at 90.6% of 2027's hourly samples, yet includes a 162-hour period of darkness.

Side-by-side comparison, simpler public/educator and more detailed professional interfaces, and an AI feature intended to help identify promising locations and times are planned. The AI selection criteria remain under discussion. Our aim is to make these conditions easier to interpret while keeping their limits clear: sunlight and geometric Earth visibility alone do not establish usable electrical power, a working radio connection or landing safety.

## END OF DRAFT TEXT

---

## TEAM NOTES AND QUESTIONS - DO NOT SUBMIT

**Everything below this heading is preparation material, not part of the high-level summary.**

### What changed after Nick's update

- Site selection and date changes are working according to Nick. Coordinate entry and clicking the lunar map are also described as available.
- Comparison is planned, not yet confirmed working.
- Separate public/educator and professional interfaces are planned.
- The AI location/time feature is planned. Nick confirmed that its selection criteria are still being decided.
- The 3D Moon is removed from scope and is not promised in the draft.
- No new website test or independent feature check was performed in this writing task. This distinction is recorded in [F02](../sources.md#f02).

### Questions corresponding to this summary

1. **Nick/team:** What are the final project and team names?

   Answer - gio/2026-11-14: Not yet confirmed.
2. **Trim:** Does coordinate entry/map clicking analyse the exact selected location or select the nearest prepared data point? The summary currently describes selection only; it does not promise equal terrain coverage for every coordinate.
3. **Nick/trim:** Once completed, which comparison and audience-interface functions should move from planned to working?
4. **Team:** What will the AI optimise, over which sites and times, and how will its suggestions be checked? Until agreed, keep the cautious planned-feature wording.

   Answer - gio/2026-11-14: Data side only: the committed data (18 prepared points, hourly 2027) and the offline scan scripts in data/ could support a search, but the criteria, sites, times and checking are not decided. Not yet confirmed (team decision).
5. **Nick:** Which audience provides the clearest demonstrated use case? Target audiences are not evidence of actual adoption.

### Evidence behind the draft

| Claim | Source and limit |
| --- | --- |
| Problem and intended audiences | NASA challenge [N06](../sources.md#n06), plus Nick's intended design |
| Available location selection and date changes | Nick's current report, [F02](../sources.md#f02); not independently tested here |
| Comparison, two interface levels and AI are planned | F02; do not silently change these to completed features |
| 18 prepared points, 2027, Horizons and LOLA | Data handoff [F01](../sources.md#f01), sections 1-5; confirm final data revision |
| 90.6% sunlight and 162-hour gap | F01 section 6: 7,936 of 8,760 samples, fixed 2 m observer height; longest dark interval occurs in May |
| Limits of sunlight and Earth visibility | F01 section 8 |

The example concerns a team-computed point, not an official NASA landing recommendation. F01 documents terrain-aware calculations for the 18 prepared points and smooth-Moon estimates for custom points. The final interface must keep that distinction clear if it still applies.

### Writing and rubric review

NASA asks what was developed, how it addresses the challenge and why it matters: [N02](../sources.md#n02), p. 6. The draft combines a concrete user question, actual selection functions, NASA inputs and one result. It separates the intended contribution from completed work.

Review against [N01](../sources.md#n01), pp. 5-7: Impact is an intended benefit, Creativity is the workflow to demonstrate, Validity rests on traceable methods and limits, Relevance on the actual NASA inputs, and Presentation on a clear explanation. No score, percentage weighting or winning probability is predicted.

The suggested 50-200 words in [N03](../sources.md#n03), 2:23-2:43, is not a verified field limit. Check the actual form. When the website is complete, replace planned-feature wording only after confirmation and keep the final summary consistent with the [detailed description](detailed-description.md).
