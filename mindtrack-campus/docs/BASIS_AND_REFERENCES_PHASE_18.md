# Basis and References — Phase 18 (Revised): Mantra Wall / Small Wins

## Source
docs/DECISIONS.md ADR-007. This phase implements the REDESIGNED feature,
not the original Section 23 open Freedom Wall spec from the Proposal
Defense panel - built directly as the revised version per ADR-007's
explicit recommendation ("no implementation work is wasted").

## Design choice: pre-moderation visibility (NOT in the original spec - flagged, not silently decided)
A post is only visible to other students once an admin sets
moderation_status='approved'. The spec only said "implement moderation
status," not whether visibility is pre- or post-moderation. Given this
is the exact feature Dr. Torres flagged as highest-risk, pre-moderation
was chosen as the safer default. STATUS: NOT YET CONFIRMED WITH ADVISER
OR PSYCHOLOGIST VALIDATOR - flag before UAT.

## Design choice: structured post_type (affirmation/gratitude/win)
Directly from ADR-007's required content-model change.

## Design choice: anonymity to students, not to admins
Directly implements Master Prompt Section 23's explicit instruction to
not falsely claim complete anonymity. user_id/reporter_id are always
stored and visible to admins; never returned in student-facing schemas.

## Compensating control: seek_assistance_notice on every post response
Directly implements ADR-007's "Required follow-up" that the seek-
assistance pathway stay highly visible on this feature specifically,
since it can no longer serve as a distress outlet itself.

## NOT in scope this phase
No automated NLP/AI content filtering - moderation is entirely human
(admin) review via the reports queue and the pending->approved gate.
Whether automated filtering should supplement this is an open question
for a future phase, not decided here.