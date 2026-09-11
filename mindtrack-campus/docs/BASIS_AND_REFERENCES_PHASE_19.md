# Basis and References — Phase 19: Notifications

## Source
Master Backend Prompt Section 24. In-app only this phase, per explicit
instruction ("Implement in-app notifications first").

## Design choice: no public create endpoint
Notifications originate from system events (e.g. a future Mantra Wall
moderation trigger), not from students or admins directly authoring
them via the API. create_notification() exists as an internal
repository function only.

## Explicitly NOT in scope this phase
Wiring create_notification() into Mantra Wall moderation (Phase 18) or
any other event source. This is a clean, separately-scoped follow-up -
not decided or silently done here.

## Required "explain if email is implemented later" (per spec) - documented, not built
If email notifications are added in a future phase:
- Email body should NEVER contain the notification's actual message
  content (which may reference journal entries, assessment results, or
  Mantra Wall moderation outcomes - all wellness-adjacent).
- Email should only say something generic ("You have a new notification -
  log in to view it") with a link back into the authenticated app.
- This mirrors the same reasoning already applied to journal/assessment
  content: sensitive material stays behind authentication, never in a
  channel (email) that isn't end-to-end controlled by this system.