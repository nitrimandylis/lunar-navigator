# High-level summary - revised working draft

> **DRAFT - preparation only. Not approved for submission.**

Revised: 15 November 2026. Evidence snapshot: 10aa615, with Nick's latest coverage confirmation. The name below follows the current app title; final naming remains a team decision.
Only the section between **DRAFT TEXT - START** and **END OF DRAFT TEXT** is proposed submission wording. Notes and remaining questions are below the boundary.

---

## DRAFT TEXT - START

A ridge near Shackleton has sunlight at 90.6% of 2027's hourly samples, yet experiences 162 consecutive hours of darkness in May. Choosing a lunar landing site requires understanding when those interruptions occur and whether a mission can tolerate them.

Lunar Landing Site Navigator turns NASA/JPL Horizons Sun and Earth positions and LRO LOLA terrain into a website connecting site comparison, physical explanation and a search for arrival times that meet a mission's needs. Users compare south pole sites in one table, sorting by sunlight, Earth visibility or hours when both are visible. Selecting a site and time updates the horizon view, charts and rise/set countdowns.

The planner checks a proposed stay against minimum sunlight, Earth visibility and maximum continuous darkness. For an illustrative 14-day stay from 1 May 2027, the Shackleton ridge meets the stated requirements while the Connecting Ridge point does not.

Guided explanations help educators and the public understand these differences; adjustable requirements and data export support preliminary mission exploration. Prepared hourly data cover 2027-2040. Results describe visibility and selected terrain indicators; spacecraft power, radio performance and landing safety require further engineering assessment.

## END OF DRAFT TEXT

---

## TEAM NOTES AND QUESTIONS - DO NOT SUBMIT

**Everything below this heading is preparation material, not part of the summary.**

### Answers incorporated

- The shared table is the comparison: Power sorts by monthly Sun hours; Comms by monthly Earth hours; Both by simultaneous hours. It is not a separate pick-two feature or a universal site-quality score.
- The implemented mission planner performs a numerical requirements search. AI remains under consideration and is excluded from delivered-capability claims.
- The interface is shared, with explanations/tour and more detailed controls. Separate audience modes are not claimed.
- Nick confirmed that coverage through 2040 now works; PR #82 adds the data and PR #87 exposes the full range in the app. The older planned-extension statement is superseded. Final screenshots and a signed-out check remain requested in the other drafts.
- Coordinates are used without snapping; custom points have no local terrain. The detailed description explains that distinction.
- The 3D Moon remains out of scope.

Basis: [trim's answers F03](../sources.md#f03), [gio's answers F04](../sources.md#f04), [earlier review F05](../sources.md#f05), [latest team handoff F07](../sources.md#f07), [current review and planner calculation F08](../sources.md#f08). The example uses the existing 14-day preset's explicit assumptions; see the detailed description for thresholds and results. The website was not run in this writing task.

### Source and rubric basis

[N02](../sources.md#n02), p. 6, asks what was developed, how it addresses the challenge and why it matters. This draft answers with the decision, actual workflow, integral NASA inputs and one checked result. The [N01](../sources.md#n01) criteria are supported by intended benefit, a specific connected workflow, bounded scientific claims, direct challenge relevance and a clear narrative. This is an evidence review, not a predicted score.

[N03](../sources.md#n03) suggests 50-200 words; that is not a verified form limit. The detailed methods and checks belong in [detailed-description.md](detailed-description.md).

### Questions - answer below each question only

Please add `Answer - name, date:` below the relevant question. Leave the draft text and question unchanged; Nick will incorporate agreed answers. Cross-references avoid asking the same question in several files.

1. **H1 - Nick:** What are the final project and team names? Should the project keep the current app title?

   Answer - Nick, date: Pending.

2. **H2 - Nick, optional readability check:** After one non-team reader reads only this summary, can they explain the problem, what users do, and why the result matters? Please record their actual feedback without claiming a formal study. This is our preparation suggestion, not a NASA submission requirement.

   Answer - Nick, date: Pending.

Final screenshots, release evidence and user-task observations are assigned in [detailed-description.md](detailed-description.md). Credits, disclosures and public links are assigned in [submission-fields.md](submission-fields.md). AI remains undecided and the interface shared; neither needs a new decision for this draft.
