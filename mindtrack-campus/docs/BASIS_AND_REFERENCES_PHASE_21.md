# Basis and References — Phase 21: Security Testing

## Source
Master Backend Prompt Section 29. Explicit goal: "A user cannot access
another user's private information simply by changing an ID in the URL."

## Scope
This phase adds a dedicated cross-cutting test suite (tests/test_security.py)
rather than new features. It consolidates IDOR, auth, role, injection,
malformed-input, oversized-payload, and privacy-bypass checks that were
previously scattered one-off across individual phase test files, into
one suite that's explicitly organized by the spec's 10 categories - so
"did we cover Section 29" has one clear answer instead of an inference
across 8 different test files.

## What this phase does NOT cover
- Real network-level SQL injection against actual Postgres (SQLAlchemy's
  parameterized queries already prevent this structurally - this suite
  proves injection-shaped INPUT is rejected/handled safely at the API
  layer, not that raw SQL concatenation doesn't exist, since it doesn't).
- Browser-level CORS enforcement (see existing TD-005).
- Rate-limiting abuse scenarios (slowapi is configured but not
  exercised here - a candidate for Phase 22, Integration Testing).