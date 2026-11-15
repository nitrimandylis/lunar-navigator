# Demo evidence and submission checks

Reviewed: 15 November 2026. Evidence snapshot: 10aa615. This is a preparation record, not the final NASA submission.

## Current evidence and its limits

The old starter-screen snapshot has been superseded. The repository now contains the comparison table, linked horizon/charts, numerical mission planner, tour, sharing/export and terrain context. Prepared hourly data cover 2027-2040. See [F07/F08](sources.md#f07) for exactly what was checked and [the detailed draft](drafts/detailed-description.md) for the proposed account.

Stored-data calculations are complete for the examples below. PR #87 now exposes 2027-2040 in the app, resolving the earlier D2 implementation question. A final browser check, screenshots and first-time user observations have not been recorded here; D1/S2 request that evidence. No server was started for this documentation work.

## Evidence already available

| Evidence | Recorded result | Basis |
| --- | --- | --- |
| Data coverage | 18 site and 18 summary filenames in every year 2027-2040; inspected ridge metadata totals 122,736 hourly samples | F08, stored files; not a complete revalidation of every array |
| May 2027 location comparison | Ridge Sun/Earth/both 512/457/436 h; shadowed point 0/0/0 h; same 744-hour window | F05/F08 |
| Whole-stay example | 14 days from 1 May 2027 00:00 UTC: ridge 296 h Sun, 300 h Earth, 21 h longest darkness; passes the stated preset. Connecting Ridge 230/300/81 h and dark at arrival; fails | F08, existing planner calculation executed against stored data |
| Published benchmark comparison | Original-point 10 m results within 0.4 percentage points; 2 m results 5-8 points lower; 20 m neighbourhood maxima still about 5 points lower | T04/T05 and F08; not a general accuracy guarantee |
| NASA data credits | Horizons, LOLA/Moon Trek terrain and hillshade, PGDA/Barker shadow polygons; corrected EPSC/Icarus/Mazarico references | Consolidated block in [sources.md](sources.md#consolidated-data-credits-for-the-submission) |

## Outstanding questions and owners

Answer each question in its corresponding draft, directly beneath it. Add `Answer - name, date:` and leave the proposed submission wording and question unchanged. Nick will incorporate agreed answers. Do not treat a pending answer as evidence of a completed check.

| Owner | Question IDs and location | Requested evidence |
| --- | --- | --- |
| Nick | H1-H2 in [summary](drafts/high-level-summary.md) | Final names and a reader's understanding of the summary |
| Trim / nitrimandylis | D1 in [detailed description](drafts/detailed-description.md); D2 resolved | Final-build screenshots, example agreement and a 2040 selection |
| Nick | D3 in [detailed description](drafts/detailed-description.md), optional | Actual non-team task observations, if performed; not a NASA-required study |
| Nick | S1 in [submission fields](drafts/submission-fields.md) | NASA project-page URL and organiser-confirmed written member credits |
| Trim / nitrimandylis | S2-S3 in [submission fields](drafts/submission-fields.md) | Signed-out public access and final app asset/permission/credit confirmation |
| Trim and Gio / supergioo0 | S4 in [submission fields](drafts/submission-fields.md) | Accurate assistance account, human checking and required acknowledgements for their respective work |

The latest data-source handoff is incorporated. No duplicate request for bibliography, a new terrain build or another explanation of the same benchmark values is outstanding. H2/D3 are optional preparation suggestions, not eligibility conditions or a promise of higher scores.

## Final manual evidence check

These checks are requested, not marked as completed:

- [ ] Open the public app while signed out; record URL, revision and date.
- [ ] Show one labelled month sorted by Power, Comms and Both; confirm these mean Sun hours, Earth hours and simultaneous hours.
- [ ] Select a site and hour; confirm the horizon view, charts and countdowns follow the selection.
- [ ] Reproduce the detailed draft's 14-day example and label its assumptions.
- [ ] Show a 2040 date, and verify which dates the planner and exported data actually include.
- [ ] Capture readable screenshots with site, UTC date/window, units and relevant settings.
- [ ] Record any real user-task observations without claiming professional validation or representative research.

## Browser and usability results log

| Revision / public URL | Task and UTC selection | Observed result | Screenshot or record | Checked by / date |
| --- | --- | --- | --- | --- |
| Pending Trim D1/S2 | Final interface and full-range release | Not recorded here | Pending | Pending |
| Pending Nick D3 | Non-team reader/user task | Not recorded here | Pending | Pending |

## Submission checks

Use [NASA rules and rubric](nasa-rules-and-rubric.md) and [submission-page guide](submission-page-guide.md) for current requirements. Their status is separate from this evidence log.

- [ ] Proposed wording matches the final public build and all placeholders are resolved.
- [ ] Final English slide demo has no more than seven slides total and opens publicly. The deck placeholder stays empty until Nick resumes it.
- [ ] NASA data, literature, software/assets and AI assistance are credited accurately.
- [ ] Applicable permission, member-credit and disclosure questions are resolved.
- [ ] Final-project, deck and NASA-page links work while signed out.
- [ ] NASA's Submit for Judging action is completed and the published confirmation checked.

Athens follows the NASA submission format; no separate local live pitch is being prepared. The older rehearsal timing in pitch.md is historical.
