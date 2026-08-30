# Technical Debt Log

This file tracks every intentional shortcut, simplification, or known limitation taken during backend development, per the project's development process (Section 50 of the Master Backend Prompt). Each entry is classified so that acceptable capstone simplifications are never confused with actual security issues — a security vulnerability is never logged here as "acceptable debt just because this is a capstone."

**Classification key:**
- **Acceptable Capstone Simplification** — a deliberate, low-risk scope reduction appropriate for a four-person undergraduate team; not expected to need resolution before submission.
- **Temporary Development Shortcut** — a stand-in solution expected to be replaced before deployment/UAT.
- **Known Limitation** — a real constraint of the current approach that is disclosed, not hidden, and does not currently pose a risk.
- **Security Issue** — must never be left unresolved; if anything below is ever reclassified into this category, it becomes the top development priority per Section 54.
- **Future Enhancement** — a nice-to-have improvement, not required for MVP.

---

| ID | Issue | Classification | Reason | Risk | Planned Resolution |
|---|---|---|---|---|---|
| TD-001 | `profiles.role` is stored as a `String` + `CHECK` constraint rather than a native PostgreSQL `ENUM` type (ADR-002). | Acceptable Capstone Simplification | Easier for the team to extend or adjust role values under time pressure without an `ALTER TYPE` migration. | Low | No resolution planned — acceptable long-term. Revisit only if the role list grows significantly beyond `student`/`admin`. |
| TD-002 | `profiles` rows are created lazily in application code (`get_or_create_profile`) the first time a new Supabase user calls `GET /api/v1/auth/me`, rather than via a Postgres trigger on `auth.users` insert. | Temporary Development Shortcut | Faster to implement and test within Phase 7's scope; avoids writing and testing database-level trigger logic this early. | Low–Medium | Consider replacing with a Postgres trigger before deployment, particularly if a dedicated `/auth/register` step is ever added — a trigger would guarantee profile creation happens atomically with account creation rather than depending on the first API call. |
| TD-003 | API rate limiting (`slowapi`) is keyed by client IP address only (`get_remote_address`). | Known Limitation | This is `slowapi`'s default and requires no additional infrastructure; sufficient for expected capstone-scale traffic and UAT cohort sizes. | Low | Revisit if UAT reveals false-positive rate-limiting for multiple students sharing a campus NAT/network. Would require a per-user (post-authentication) limiting key instead of/in addition to per-IP. |
| TD-004 | During Phase 6, Alembic's `--autogenerate` initially produced a migration that attempted to create Supabase's own `auth.users` table, which failed with `InsufficientPrivilege` and required a three-round fix (adding and correctly wiring an `include_object` filter in `alembic/env.py`, plus manually correcting the already-generated migration file). | Resolved — logged for traceability only | Alembic has no schema-awareness by default when comparing metadata that includes cross-schema reference tables. | None ongoing — structurally closed via ADR-004 | Closed. No further action required. Logged here (and in ADR-004) so a future teammate who regenerates a migration from scratch understands why `include_object` exists in `env.py` and does not remove it. |
| TD-005 | No automated test asserts that a disallowed CORS origin is actually rejected — CORS behavior was verified manually via `curl -i` header inspection only. | Known Limitation | Automated browser-level CORS testing requires tooling beyond `pytest`/`TestClient` (which doesn't enforce browser CORS semantics); manual verification was judged sufficient for Milestone 1. | Low | Add a lightweight automated check (e.g., asserting the `access-control-allow-origin` response header is absent or does not match a disallowed origin) before Milestone 4's security testing phase, so this isn't manual-only long-term. |
| TD-006 | No automated test exercises the real network call to Supabase's `/auth/v1/user` endpoint — all authentication tests mock `get_current_supabase_user` at the dependency level. | Known Limitation | This is the correct approach for unit testing (isolating our own logic from external network dependencies), but it means a real regression in the Supabase integration itself (e.g., a response-shape change) would only surface through manual testing, not `pytest`. | Low–Medium | Consider adding a small, separately-run integration test (not part of the default `pytest` suite) that hits a real Supabase test project, for use before major milestones or deployment — not required for day-to-day development. |

---

## Notes on Maintaining This File

- When a new shortcut is taken, add a row **at the time the decision is made**, not retroactively at the end of a milestone — this matches the project's "do not hide technical debt" rule.
- If any item's risk level increases (e.g., TD-003 causes real UAT problems, or TD-006's gap actually lets a regression through), update its row rather than opening a duplicate entry.
- Milestone Reviews (see `docs/DEVELOPMENT_LOG.md`) should reference this file directly rather than re-deriving the list from memory.
