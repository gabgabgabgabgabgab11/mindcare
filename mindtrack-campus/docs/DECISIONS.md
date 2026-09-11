# Architecture Decision Records

This file tracks major technology and architecture decisions made during backend development, per the project's development process (Section 51 of the Master Backend Prompt). Each entry records the context, options considered, the decision made, the reasoning, and the resulting trade-offs — so a future teammate (or a validator/panel member asking "why did you build it this way?") doesn't have to reconstruct the reasoning from git history alone.

---

## ADR-001 — Supabase Auth over a Custom `users` Table

### Context
The backend needs to handle student/admin registration, login, password storage, and session/token issuance. We needed to decide whether to build this ourselves in FastAPI or delegate it to Supabase's built-in Auth service.

### Options Considered
1. Custom FastAPI authentication: our own `users` table, password hashing, JWT issuance and refresh logic, email verification flow, password-reset flow — all built and maintained by the team.
2. Supabase Auth: use Supabase's existing, hosted authentication service; our backend only verifies tokens it issues.
3. A third-party identity provider (e.g., Auth0, Firebase Auth) integrated separately from the database layer.

### Decision
Supabase Auth (Option 2).

### Reason
The project already uses Supabase for PostgreSQL hosting, so no additional infrastructure is introduced. Supabase Auth provides password hashing, email confirmation, and password-reset flows out of the box — all of which are security-sensitive to build correctly and are not the research focus of this capstone. Building our own would duplicate work Supabase already does safely, and would meaningfully increase the security surface a four-person student team is responsible for getting right.

### Consequences
- **Advantage:** No password storage, hashing, or reset-flow code exists anywhere in our own codebase — an entire class of security risk is delegated to a maintained service.
- **Advantage:** Free tier is sufficient for capstone-scale traffic.
- **Disadvantage:** Introduces a runtime dependency on Supabase's Auth API being reachable (see ADR-003) — if Supabase Auth has downtime, our authenticated routes go down with it.
- **Disadvantage:** Some vendor lock-in — migrating off Supabase later would require rebuilding the authentication layer.

---

## ADR-002 — String + CHECK Constraint over Native Postgres ENUM for `role`

### Context
The `profiles.role` column needs to represent a small, closed set of values (`student`, `admin`). We needed a storage strategy for this constrained field.

### Options Considered
1. A native PostgreSQL `ENUM` type.
2. A `String` column with a `CHECK` constraint restricting allowed values.
3. A separate `roles` lookup table with a foreign key from `profiles`.

### Decision
`String` column + `CHECK` constraint (Option 2).

### Reason
Native Postgres enums require an `ALTER TYPE` operation to add a new value, which is more error-prone and harder to cleanly roll back under time pressure than editing a `CHECK` constraint through a normal Alembic migration. A separate lookup table was judged to be unnecessary complexity for a fixed set of two roles at this project's scale.

### Consequences
- **Advantage:** Adding or adjusting role values later is a simple, low-risk migration.
- **Advantage:** Easier for a student team to reason about and modify without deep Postgres-enum-specific knowledge.
- **Disadvantage:** Slightly weaker type safety at the database level than a native enum (a typo'd role string is only caught by the `CHECK` constraint, not by the column type itself).
- **Mitigation:** Role values are also validated at the API layer via Pydantic/RBAC dependencies, providing a second layer of enforcement.

---

## ADR-003 — Verify Supabase JWTs via the Supabase Auth API, Not Local Decoding

### Context
The backend needs to confirm that a bearer token presented by a client is genuinely valid and determine which Supabase user it belongs to.

### Options Considered
1. Decode and verify the JWT locally using Supabase's JWT signing secret.
2. Call Supabase's own `/auth/v1/user` endpoint on every authenticated request, letting Supabase confirm validity and return the user's identity.
3. Use a Supabase server-side SDK to handle verification internally.

### Decision
Call Supabase's `/auth/v1/user` endpoint directly (Option 2).

### Reason
Local JWT verification would require our backend to store, protect, and potentially rotate Supabase's JWT signing secret — a highly sensitive credential whose mismanagement could compromise every user's session. Delegating verification to Supabase's own API removes that risk entirely, at the cost of one additional network round-trip per authenticated request, which is an acceptable trade-off at this project's traffic scale.

### Consequences
- **Advantage:** No JWT signing secret exists anywhere in our backend's configuration or code.
- **Advantage:** Conceptually simple for a four-person team to reason about and debug.
- **Disadvantage:** Adds latency (one extra HTTP call) to every authenticated request.
- **Disadvantage:** Creates a hard runtime dependency — if Supabase's Auth API is unreachable, every authenticated route in our backend fails, even if our own database is healthy. This is a documented, accepted risk (see `docs/TECHNICAL_DEBT.md`, related to TD-002).

---

## ADR-004 — Explicit `auth` Schema Exclusion in Alembic Autogenerate

### Context
During Phase 6 (Database Models), Alembic's `--autogenerate` compared our SQLAlchemy metadata against the live database and incorrectly attempted to generate a migration that created Supabase's own `auth.users` table — which our database role has no permission to modify, and which must never be altered by our migrations in the first place. This caused a multi-attempt debugging cycle before being correctly resolved.

### Options Considered
1. Manually edit every future autogenerated migration by hand to strip out any `auth.*` operations, relying on developer vigilance each time.
2. Add an `include_object` filter function to `alembic/env.py` that excludes any table in the `auth` schema from comparison entirely, so autogenerate can never propose changes to it.
3. Avoid referencing `auth.users` in SQLAlchemy metadata at all, and manage the foreign key relationship without a mapped reference table.

### Decision
Add an `include_object` filter to `alembic/env.py` (Option 2).

### Reason
Manual per-migration vigilance (Option 1) is exactly the kind of easy-to-forget step that caused this incident in the first place — it doesn't scale safely across a team or across time. Avoiding the reference table entirely (Option 3) would have made the foreign key to `auth.users.id` harder to express cleanly in SQLAlchemy. A structural filter in `env.py` closes the entire class of problem permanently, for every future migration, without relying on anyone remembering to check.

### Consequences
- **Advantage:** No future autogenerate run can ever again propose creating, altering, or dropping anything in the `auth` schema — this is now enforced structurally, not procedurally.
- **Advantage:** The one already-generated bad migration was manually corrected once and does not need to be revisited.
- **Disadvantage:** None identified — this is a strict safety improvement with no functional trade-off.
- **Related:** See `docs/TECHNICAL_DEBT.md`, TD-004, for the incident record.

---

## ADR-005 — Wellness Priority Computed On-Demand, Not Cached

### Context

`GET /api/v1/wellness/priority` (Phase 14) combines the latest PHQ-9 result, latest GAD-7 result, and recent journal sentiment labels into a single priority tier. We needed to decide whether to compute this value fresh on every request, or compute it once and cache/store the result (e.g., in a `wellness_priority_snapshots` table) for faster reads.

### Options Considered

1. Store a cached wellness-priority row, recomputed and overwritten whenever a new PHQ-9/GAD-7/journal entry is submitted.
2. Compute the priority fresh, on-demand, every time `GET /api/v1/wellness/priority` is called, reading directly from `assessment_results` and `journal_analysis`.
3. Compute on-demand but cache in-memory (e.g., Redis) with a short TTL.

### Decision

Compute on-demand, no caching (Option 2).

### Reason

A cached value creates a synchronization problem: every write path that could affect wellness priority (PHQ-9 submission, GAD-7 submission, journal creation triggering NLP) would need to remember to invalidate or recompute the cache, and a missed invalidation would silently show a student a stale, potentially reassuring-when-it-shouldn't-be result. Given this system's clinically-adjacent context, a stale `LOW` priority sitting uncorrected in a cache is a worse failure mode than the small, acceptable cost of a few extra database reads per request. Option 3 (Redis) was rejected as unnecessary infrastructure for the read volume this endpoint will realistically see at capstone/UAT scale.

### Consequences

- **Advantage:** Structurally impossible for wellness priority to be stale — it is always a direct function of current data.
- **Advantage:** No new invalidation logic to write, test, or get wrong.
- **Disadvantage:** Slightly higher per-request database cost (multiple queries instead of one cache lookup) — acceptable at current and projected UAT scale.
- **Note for future maintainers:** If this endpoint's latency ever becomes a real problem at larger scale, revisit with actual measurements before reaching for a cache — do not reintroduce Option 1 or 3 preemptively.

---

## ADR-006 — Suppress Raw Numeric Scores in Student-Facing Responses; Qualitative Language Only

### Context

Following the project's psychologist validator's (Dr. [Doc Elle]) professional review of the implemented system, she raised a specific, direct concern (Sections 8–9 of her review): displaying a raw numeric wellness score (her example: "67") risks students comparing scores with each other or self-interpreting a number in an unintended, potentially harmful way. She explicitly recommended using **words or subjective descriptions instead of raw numerical scores**, and separately noted the panel had already independently flagged the same risk (a declining numeric score being psychologically risky to see). This is now a validated, non-negotiable requirement, not a stylistic preference — it directly contradicts the current implementation, where `Phq9ResultResponse`, `Gad7ResultResponse`, and history endpoints all currently return a `total_score` integer field (Phases 10 and 11).

### Options Considered

1. Leave `total_score` in the API response but instruct the frontend never to display it (rely on frontend discipline only).
2. Remove `total_score` from every student-facing response schema entirely; retain it only in the underlying database row (for the OSS Admin's future de-identified aggregate views and for the student's own longitudinal trend calculations, computed server-side).
3. Remove `total_score` from the database entirely, storing only `severity_band`.

### Decision

Option 2 — remove `total_score` from all student-facing API responses; retain it in storage only.

### Reason

Option 1 was rejected because it relies on the frontend remembering not to render a field that is sitting right there in the API response — exactly the kind of discipline-dependent safeguard the project's own Security and Privacy architecture has consistently avoided elsewhere (e.g., RLS instead of "the frontend just won't ask for it"). Option 3 was rejected because the raw score is still useful, non-identifying, internally-computed data for the student's own longitudinal trend line and for future properly-aggregated, de-identified OSS Admin analytics (Milestone 3) — deleting it outright would foreclose legitimate future uses for no added safety benefit, since the actual risk is display, not storage.

### Consequences

- **Advantage:** Directly resolves the psychologist's top-priority concern and the panel's independently flagged risk about declining-score visibility.
- **Advantage:** Consistent with the project's broader pattern of enforcing safety structurally (removing the field) rather than procedurally (asking the frontend nicely).
- **Disadvantage:** Requires a breaking change to `Phq9ResultResponse`, `Gad7ResultResponse`, `Phq9HistoryItem`, `Gad7HistoryItem`, and their frontend consumers (none of which exist yet on the frontend side, so the breaking-change cost is currently limited to backend schemas and their tests).
- **Required follow-up:** A new mapping from `severity_band` to approved qualitative language (e.g., `minimal` → "Your responses suggest minimal difficulty at this time") must be authored and, ideally, reviewed by Dr. [Doc Elle] directly, since the wording of qualitative feedback is itself a clinical-communication choice, not a purely technical one.
- **Scope note:** This ADR authorizes the architecture of the fix (remove the field, add qualitative mapping). It does not yet authorize specific wording — that should be drafted and validated before being shipped to real students in UAT.

---

## ADR-007 — Redesign Freedom Wall into a Positive-Only "Mantra Wall / Small Wins" Feature

### Context

Freedom Wall was originally scoped (per the Proposal Defense panel's Required Revision #3) as an anonymous, open peer-support posting feature with content filtering and moderation. It has not yet been implemented in the backend (planned for Milestone 3). The project's psychologist validator reviewed this concept directly and raised a substantive clinical concern: an open anonymous wall carries real risk of self-harm content, bullying, discrimination, and posts naming other individuals, and she assessed that AI filtering, human moderation, and reporting — while good safeguards — "may not completely prevent harmful content." Her explicit, stronger recommendation was to **redesign the feature into a positive-only format** (a "Mantra Wall" or "Small Wins" activity), where students anonymously share affirmations, achievements, or uplifting experiences rather than open-ended posts of any sentiment.

### Options Considered

1. Build Freedom Wall exactly as originally scoped (open anonymous posting + AI filter + human moderation + reporting), accepting the residual risk the validator flagged.
2. Redesign the feature as a positive-only "Mantra Wall / Small Wins" board: students may only post affirmations, gratitude notes, or small personal wins — no open-ended negative, distressed, or complaint-style content is an intended use case at all.
3. Cancel the feature entirely.

### Decision

Option 2 — redesign as a positive-only "Mantra Wall / Small Wins" feature.

### Reason

Option 1 was rejected because it would mean knowingly proceeding against a direct, specific safety recommendation from the project's own psychologist validator, on a feature whose entire premise (anonymous, unmoderated-until-reviewed posting) is exactly the risk surface she flagged. Option 3 was rejected because it abandons the panel's original Required Revision #3 ("a support wall for the users... so they would know that they are not alone") entirely, when a narrower, safer version can still satisfy that underlying goal — the panel's stated intent was peer connection and reducing isolation, not specifically open-ended anonymous discourse. A positive-only framing satisfies the same underlying goal (students seeing that peers are also managing stress/wellness, reducing isolation) while structurally removing most of the harmful-content risk category, since the content type itself excludes self-harm disclosure, bullying, or naming individuals almost by construction.

### Consequences

- **Advantage:** Directly resolves the single risk the validator considered strong enough to recommend a redesign rather than additional safeguards.
- **Advantage:** Content moderation becomes structurally simpler — a moderation/filter system for "is this actually a positive affirmation or small win" is a narrower, more tractable problem than "is this any form of harmful content across an open topic space."
- **Advantage:** Still satisfies the panel's original required revision (peer support, reduced isolation) without the residual risk profile of an open wall.
- **Disadvantage:** Narrower feature than originally scoped — students cannot use it to express distress or seek peer support for a difficult moment, which was part of the original "you are not alone" framing. This should be explicitly compensated for by ensuring the persistent "seek assistance" resource pathway (already required elsewhere in the system) remains highly visible on this feature's screens specifically, since it can no longer serve as an outlet for expressed distress itself.
- **Required follow-up:** Section 13's backend design (post lifecycle, moderation states) needs to be revised before implementation begins. This changes the content model (structured positive-post types such as affirmation, gratitude, or win rather than free-form open text) more than the architecture (anonymity, moderation queue, and reporting remain structurally similar). Recommend scoping this as "Phase 18 (Revised): Mantra Wall / Small Wins" rather than building the original open-wall design and revising afterward; no implementation work is wasted because the backend for this feature has not started.



---

## ADR-008 — Mantra Wall Pre-Moderation Visibility

### Status
**PROPOSED — pending confirmation from adviser/psychologist validator.** Implemented in code as of Phase 18, but not yet signed off as the final decision.

### Context

ADR-007 redesigned Freedom Wall into the Mantra Wall / Small Wins concept but did not specify whether a new post should be visible to other students immediately upon posting (post-moderation, with admin able to retroactively hide/reject) or only after explicit admin approval (pre-moderation). The Master Backend Prompt (Section 23) says to "implement moderation status" but does not resolve this ordering question.

### Options Considered

1. Post-moderation: post is visible immediately; admin can later hide/reject it.
2. Pre-moderation: post is invisible to other students until an admin explicitly approves it; visible only to its author (and admins) until then.

### Decision

Option 2 (pre-moderation) was implemented as the default, pending confirmation.

### Reason

Given this is the exact feature Dr. Torres flagged as highest-risk (self-harm content, bullying, doxxing) even in its redesigned positive-only form, pre-moderation was judged the safer default to build against, at the cost of no instant gratification on posting.

### Consequences

- **Advantage:** No harmful or identifying content is ever visible to other students, even briefly, before a human reviews it.
- **Disadvantage:** Slower feedback loop for students posting — may reduce engagement with the feature compared to instant publishing.
- **Required follow-up:** Confirm this choice with the adviser and/or Dr. Torres before UAT. If reversed to post-moderation, the required code change is small (the `list_visible_posts` filter), not a rebuild.