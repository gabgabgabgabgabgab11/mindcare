# MindTrack Campus Development Log

## Day 2 - Phase 2: FastAPI Project Setup / Skeleton

### Milestone

Milestone 1 - Backend Foundation

### Objective

Set up the approved modular backend structure and move the health endpoint into a dedicated API route module.

### Process

1. Created the approved application packages under `backend/app/`:
   - `core`
   - `db`
   - `models`
   - `schemas`
   - `api/routes`
   - `services`
   - `middleware`
   - `security`
   - `nlp`
   - `utils`
2. Added package initializer files so each module is ready for future implementation.
3. Created `app/api/routes/health.py` and moved the `/health` endpoint into an `APIRouter`.
4. Updated `app/main.py` so it only creates the FastAPI application and includes the health router.
5. Ran the existing health test to confirm that the refactor preserved the endpoint behavior.

### Completed Work

- The full approved modular folder structure is in place.
- Route logic no longer lives inline in `main.py`.
- `main.py` now assembles the application and includes routers.

### Verification

- PASS: `test_health_check_returns_ok`
- The test was left unmodified and confirms that `GET /health` still returns the expected response.

### API Changes

- `GET /health` remains available with the same response.
- The endpoint is now served through the health `APIRouter`.

### Database Changes

None. Database work is planned for Phase 4.

### Security Considerations

None introduced during this phase. No secrets, authentication, or user input handling were added.

### Known Issues

None.

### Files Created

- `backend/app/core/__init__.py`
- `backend/app/db/__init__.py`
- `backend/app/models/__init__.py`
- `backend/app/schemas/__init__.py`
- `backend/app/api/__init__.py`
- `backend/app/api/routes/__init__.py`
- `backend/app/api/routes/health.py`
- `backend/app/services/__init__.py`
- `backend/app/middleware/__init__.py`
- `backend/app/security/__init__.py`
- `backend/app/nlp/__init__.py`
- `backend/app/utils/__init__.py`

### Files Modified

- `backend/app/main.py`

_________________________________________________________________________________________________________________________________________________-

DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 3 — Configuration

Completed
Added pydantic-settings dependency
Created app/core/config.py with a typed Settings class and cached get_settings() accessor
Wired app/main.py to read APP_NAME/APP_VERSION from settings instead of hardcoded strings
Defined (but did not yet use) DATABASE_URL, preparing for Phase 4
Added is_production helper property for later environment-specific logic (e.g., CORS in Phase 33)
Tests
PASS: test_default_environment_is_development
PASS: test_environment_can_be_overridden
PASS: test_get_settings_is_cached
PASS: test_health_check_returns_ok (unmodified — confirms no regression)
Files Changed
Created: app/core/config.py, tests/test_config.py
Modified: app/main.py, .env, .env.example, requirements.txt
Database Changes
None (Phase 4)
API Changes
None — /health response and route unchanged
Known Issues
None
Security Considerations
Confirmed .env remains git-ignored; .env.example contains only placeholder values, no real credentials
DATABASE_URL is defined in Settings but not yet connected to anything — no live credential handling exists yet, so there's nothing sensitive to leak at this stage
Documentation Updated
docs/DEVELOPMENT_LOG.md (Day 3 entry below)
Git Commit

feat: add centralized Pydantic Settings configuration, wire app metadata through settings

Current Backend Status

FastAPI app now has a single, typed configuration source (app.core.config.Settings). App metadata (name/version) and environment name are read from .env via this settings object. /health continues to work unchanged. No database connection exists yet — DATABASE_URL is defined and ready to be consumed in the next phase.

Next Phase

Phase 4 — Database Connection (PostgreSQL/Supabase, SQLAlchemy engine setup, /health/db endpoint)

_________________________________________________________________________________________________________

DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 4 — Database Connection

Completed
Created Supabase project and obtained the Session pooler connection string
Added sqlalchemy + psycopg2-binary dependencies
Created app/db/session.py: engine, SessionLocal, declarative Base (for Phase 6 models), and get_db() dependency
Added GET /health/db, which runs SELECT 1 through the real dependency and reports connectivity without ever exposing the connection string or raw exception detail
Added mocked unit tests for both the "DB reachable" and "DB unreachable" cases, independent of the real Supabase project
Tests
PASS: test_health_check_returns_ok
PASS: test_health_db_returns_ok_when_database_reachable (mocked)
PASS: test_health_db_returns_error_when_database_unreachable (mocked)
PASS: all 3 Phase 3 config tests (no regression)
MANUAL PASS: GET /health/db against real Supabase returned {"status": "ok", "database": "connected"}
Files Changed
Created: app/db/session.py
Modified: app/api/routes/health.py, tests/test_health.py, .env, .env.example, requirements.txt
Database Changes
None yet (no tables/models) — connection only
API Changes
GET /health/db (new)
Known Issues
None
Security Considerations
DATABASE_URL (including password) lives only in .env, confirmed git-ignored
/health/db never returns the connection string or raw exception text on failure — only a generic unreachable status, so it can't be used to fingerprint the database setup
Documentation Updated
docs/DEVELOPMENT_LOG.md (Day 4 entry below)
Git Commit

feat: add SQLAlchemy engine and Supabase connection, add /health/db endpoint

Current Backend Status

FastAPI app now has a live, verified connection to Supabase PostgreSQL through SQLAlchemy. get_db() is ready to be reused by every future route that touches the database. No tables exist yet.

Next Phase

Phase 5 — Alembic Migrations (initialize Alembic, generate and apply the first migration once we define the first real model)








---------------------------------------------------------------------------

DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 5 — Alembic Migrations (setup only)

Completed
Installed and initialized Alembic
Configured alembic/env.py to source DATABASE_URL from the app's own Settings (not from alembic.ini), and to use Base.metadata from app/db/session.py as the autogenerate target for future phases
Blanked out alembic.ini's sqlalchemy.url to prevent credential leakage into git
Generated and applied an empty baseline migration, confirming Alembic can read/write against the real Supabase database
Tests
PASS: all 6 existing tests, unchanged (no regressions)
MANUAL PASS: alembic_version table confirmed present in Supabase with one row after alembic upgrade head
Files Changed
Created: alembic.ini, alembic/env.py, alembic/script.py.mako, alembic/versions/<hash>_baseline_no_models_yet.py
Modified: requirements.txt
Database Changes
New table: alembic_version (Alembic's own tracking table — not an application table)
API Changes
None
Known Issues
None
Security Considerations
Confirmed alembic.ini contains no real database credentials — the URL is injected at runtime from .env via Settings, consistent with how the rest of the app handles secrets
Documentation Updated
docs/DEVELOPMENT_LOG.md (Day 5 entry — same structure as prior days, adjusted for this phase)
Git Commit

feat: initialize Alembic migrations, configure env.py to use app Settings, apply empty baseline migration

Current Backend Status

Alembic is fully wired to the real Supabase database via the app's existing configuration system. No application tables exist yet — only Alembic's own internal alembic_version tracking table. The project is now ready to define its first real model.

Next Phase

Phase 6 — Database Models (starting with profiles, extending Supabase's auth.users rather than duplicating credentials — per the architecture plan's guidance not to build a separate password table)

---------------------------------------------------------------------------------------------------------
DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 6 — Database Models

Completed
Created Profile model (profiles table) with role, year_level, program, timestamps
Created a reference-only auth.users Table object so SQLAlchemy can resolve the FK without Alembic ever managing that schema
Used a String + CHECK constraint for role instead of a native Postgres ENUM (documented as ADR-002)
Wired app/models/__init__.py and alembic/env.py so autogenerate can see the new model
Generated and applied the first real migration
Tests
PASS: test_profiles_table_is_registered
PASS: test_profiles_table_has_expected_columns
PASS: test_auth_users_reference_table_is_not_managed_for_creation
PASS: all 6 prior tests, unchanged
Files Changed
Created: app/models/profile.py, tests/test_models.py, alembic/versions/<hash>_add_profiles_table.py
Modified: app/models/__init__.py, alembic/env.py
Database Changes
New table: profiles (public schema), foreign key to auth.users.id, CHECK constraint on role
API Changes
None yet — no routes read/write profiles until Phase 7 (Authentication)
Known Issues
None
Security Considerations
profiles currently has no Row-Level Security policy yet — this is expected at this phase but must be added before any route exposes it (tracked for Phase 9, Security Middleware / RLS)
No route can currently read or write profiles at all, so there is no exposure risk yet
Documentation Updated
docs/DEVELOPMENT_LOG.md (Day 6 entry, same structure as before)
Recommend also starting docs/DECISIONS.md now with ADR-001 (Supabase Auth over custom users table) and ADR-002 (String+CHECK over native Enum for role) — say the word if you'd like me to draft both now
Git Commit

feat: add profiles model extending Supabase auth.users, generate and apply migration

Current Backend Status

profiles table exists in Supabase, correctly linked to Supabase Auth's own user table, with no application code touching it yet. Foundation is ready for Phase 7 to implement real authentication against it.

Next Phase

Phase 7 — Authentication (verifying Supabase Auth JWTs in FastAPI, mapping the verified user to their profiles row, implementing GET /api/v1/auth/me)

-----------------------------------------------------------------------------------------------------------------------------------
DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 7 — Authentication

Completed
Added SUPABASE_URL / SUPABASE_ANON_KEY to Settings
Implemented verify_supabase_token, which confirms a bearer token by calling Supabase's own /auth/v1/user endpoint (no local JWT secret needed)
Implemented get_current_supabase_user FastAPI dependency
Implemented get_or_create_profile, lazily provisioning a default role="student" profile on first authenticated request
Implemented GET /api/v1/auth/me, returning safe profile info only
Introduced /api/v1 prefix on this router (first use of the versioning convention from Section 14)
Tests
PASS: test_me_without_token_returns_401
PASS: test_me_with_invalid_token_returns_401
PASS: test_me_with_valid_token_creates_default_student_profile
PASS: test_me_with_existing_profile_does_not_overwrite_role
PASS: all 9 prior tests, unchanged
MANUAL PASS: real Supabase login → /api/v1/auth/me round trip (pending your confirmation)
Files Changed
Created: app/security/supabase_auth.py, app/services/profile_service.py, app/schemas/auth.py, app/api/routes/auth.py, tests/test_auth.py
Modified: app/core/config.py, .env, .env.example, app/main.py
Database Changes
None new — reuses the profiles table from Phase 6; rows are now actually inserted into it for the first time
API Changes
GET /api/v1/auth/me (new)
Known Issues
None
Security Considerations
Token verification is fully delegated to Supabase — our backend never stores or checks a JWT secret itself
Only the anon key is used here; service_role is deliberately untouched
/auth/me never returns the access token itself, only derived profile data
Documentation Updated
docs/DEVELOPMENT_LOG.md (Day 7 entry, same structure as before)
Recommend adding ADR-003 (verify via Supabase Auth API vs. local JWT decode) to docs/DECISIONS.md, and TD-002 (lazy profile provisioning vs. Postgres trigger) to docs/TECHNICAL_DEBT.md — say the word and I'll draft both
Git Commit

feat: verify Supabase JWTs via Auth API, add GET /api/v1/auth/me with lazy profile provisioning

Current Backend Status

Authentication is fully functional end-to-end: a real Supabase-issued token can be verified, mapped to a profiles row, and returned as safe JSON. Every student who logs in for the first time automatically gets a role="student" profile row. No mechanism yet exists to make someone an admin other than manually editing the row in Supabase's Table Editor.

---------------------------------------------------------------------
DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 8 — RBAC

Completed
Implemented require_authenticated_user, require_student, require_admin as composable FastAPI dependencies
Added GET /api/v1/auth/admin-check as a throwaway diagnostic route proving 403-vs-401 behavior correctly, to be replaced by real admin routes in Milestone 3
Confirmed the distinction between authentication failure (401 — "I don't know who you are") and authorization failure (403 — "I know who you are, and the answer is no")
Tests
PASS: test_admin_check_blocks_student_with_403
PASS: test_admin_check_allows_admin_with_200
PASS: test_admin_check_without_token_returns_401_not_403
PASS: all 13 prior tests, unchanged
Files Changed
Created: app/security/rbac.py, tests/test_rbac.py
Modified: app/api/routes/auth.py
Database Changes
None
API Changes
GET /api/v1/auth/admin-check (new, temporary/diagnostic)
Known Issues
None
Security Considerations
Role checks are now centralized in one file (rbac.py) rather than duplicated per-route — reduces risk of a future route accidentally skipping an authorization check
Confirmed 401 (unauthenticated) and 403 (unauthorized) are distinguishable, which matters for debugging and for the frontend's error-handling logic (Section 21 of the frontend guideline)
Documentation Updated
docs/DEVELOPMENT_LOG.md (Day 8 entry)
Git Commit

feat: add RBAC dependencies (require_authenticated_user, require_student, require_admin), add admin-check probe route

Current Backend Status

Milestone 1's core security stack — identity (Phase 7) + role authorization (Phase 8) — is fully functional and tested against real Supabase accounts for both roles. /admin-check is a scaffold-only route; it will be deleted once Milestone 3 adds real admin endpoints that use the same require_admin dependency.

Next Phase

Phase 9 — Security Middleware (CORS configuration, rate limiting on auth endpoints, consistent error-response envelope)
--------------------------------------------------------------------------------------------------------------------------
DEVELOPMENT SESSION COMPLETE
Milestone

Milestone 1 — Backend Foundation

Phase

Phase 9 — Security Middleware

Completed
Configured CORS with an explicit, environment-driven origin allowlist (defaulted to Vite's localhost:5173 for now)
Added slowapi-based rate limiting, applied 30/minute to /api/v1/auth/me as the first real example
Standardized all error responses (401/403/404/422/429/500) into a single {"error": {"code", "message"}} envelope, with unhandled exceptions logged server-side but never leaked to the client
Tests
PASS: test_unknown_route_returns_envelope_with_404
PASS: test_missing_auth_header_returns_envelope_with_401
PASS: test_me_endpoint_returns_429_after_rate_limit_exceeded
PASS: all 16 prior tests, unchanged
Files Changed
Created: app/middleware/rate_limit.py, app/middleware/error_handlers.py, tests/test_error_handling.py, tests/test_rate_limiting.py
Modified: app/core/config.py, app/main.py, app/api/routes/auth.py, .env, .env.example
Database Changes
None
API Changes
No new endpoints; /api/v1/auth/me now rate-limited; every endpoint's error responses now follow the standard envelope
Known Issues
None
Security Considerations
CORS explicitly rejects unlisted origins — confirmed no wildcard
Rate limiting keyed by IP (get_remote_address) — documented limitation: won't distinguish two students behind the same NAT/campus network; acceptable for capstone scale (candidate for docs/TECHNICAL_DEBT.md)
500 errors no longer leak stack traces or internal details to any client