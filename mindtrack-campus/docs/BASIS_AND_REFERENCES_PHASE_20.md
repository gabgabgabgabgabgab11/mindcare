# Basis and References — Phase 20: Audit Logs

## Source
Master Backend Prompt Section 25 and Section 11 permission matrix
(Audit logs: Student=No, Admin=Read).

## Design choice: read-only, no write endpoint
There is deliberately no POST/PUT/DELETE route for audit logs anywhere,
even for admins - matches the matrix exactly ("Read" not "CRUD").

## Design choice: content-safety is a calling convention, not a structural guarantee
`description` and `event_metadata` are free text/JSON. The model and
repository CANNOT prevent a future caller from putting journal content,
a password, or a token into them. This is documented loudly in
log_event()'s docstring, but is a real ongoing risk during Phase 20B
(the actual wiring) that needs to be checked at code review time for
each of the 7 event sources, not assumed solved by this phase.

## Explicitly NOT in scope this phase (Phase 20B, recommended separately)
Actually calling log_event() from: login, failed authentication,
assessment submission (PHQ-9/GAD-7), journal creation/deletion, privacy
setting changes, admin actions, and Mantra Wall moderation. Deferred for
the same blast-radius reasons Phase 15B was split from Phase 15 -
touching 7+ already-tested files in one pass is exactly the pattern
this project avoids.