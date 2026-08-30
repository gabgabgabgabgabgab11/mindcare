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
