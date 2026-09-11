# Basis and References — Phase 22: Integration Testing

## Source
No dedicated spec section exists in the Master Backend Prompt for this
phase - only its name in the Milestone 4 phase list and "database
integration tests where appropriate" (Section 1). This phase's content
was designed to close TD-006 (no automated test exercises a real
database), which explicitly recommended this work "before major
milestones or deployment."

## Design choice: excluded from default `pytest` run
via pytest.ini's `addopts = -m "not integration"`. Day-to-day `pytest`
stays fast and DB-independent, matching every prior phase's convention.
Integration tests run explicitly, intended for use before milestone
reviews and before deployment - exactly as TD-006 recommended.

## Design choice: hard refusal if TEST_DATABASE_URL looks like production
conftest.py actively checks for this and fails loudly rather than risk
running destructive-adjacent test operations against real student data.

## What this resolves
TD-006 can be marked Resolved once this phase's test is confirmed
passing against a real test database - update docs/TECHNICAL_DEBT.md
accordingly rather than leaving it open indefinitely.