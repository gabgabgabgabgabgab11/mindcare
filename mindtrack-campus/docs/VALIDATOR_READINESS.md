# MindCare — Validator Readiness and Security Record

**Last reviewed:** 2026-10-23  
**System scope:** React/Vite frontend, FastAPI REST API, Supabase Auth and PostgreSQL.

## 1. Login, Sessions, and Passwords

### Implemented mechanism

- Supabase Auth performs account creation, password verification, password-reset emails, access-token issuance, refresh-token rotation, and logout.
- The frontend stores the Supabase session using the SDK's explicit `persistSession` and `autoRefreshToken` settings. The app restores the session on load, observes authentication events, and signs the user out when an API request returns `401`.
- The frontend sends the Supabase access token as a Bearer token. The API validates it against Supabase Auth before protected operations.
- Passwords are **not stored, hashed, or encrypted by MindCare's FastAPI application**. Password hashing implementation and configuration are managed by Supabase and must be verified in the project's Supabase dashboard/official service documentation before making a specific cryptographic claim in the manuscript.
- Sensitive journal content and optional check-in notes are encrypted at the application layer using `cryptography.fernet.Fernet` before database storage. Fernet provides authenticated symmetric encryption; its key is supplied only by `JOURNAL_ENCRYPTION_KEY`.

### Failed-sign-in behavior

- The login screen allows **five unsuccessful attempts in a 15-minute browser-session window**. On the fifth failure it disables sign-in and displays: “Too many unsuccessful sign-in attempts. Please wait 15 minutes before trying again.”
- This browser-side lockout improves the normal user experience but is not a substitute for provider-side abuse protection because a malicious caller can bypass browser code. Before UAT/production, an administrator must enable and record the Supabase project’s Auth rate limits and CAPTCHA/bot protection settings.

### Password reset test protocol

1. In Supabase Auth settings, add the exact deployed URL ending in `/reset-password` to the allowed redirect URLs.
2. From `/forgot-password`, request a reset for a test account.
3. Confirm the email link opens `/reset-password`, rejects an expired link, and accepts a compliant new password.
4. Verify the old password no longer works and the new password works.

The reset-request screen intentionally gives the same success response whether or not an account exists, avoiding account-enumeration disclosure.

### JWT, refresh token, and AWS clarification

The architecture uses Supabase-issued JWT access tokens and Supabase-managed refresh tokens. The API intentionally validates access tokens through Supabase rather than storing a JWT signing key locally. No AWS identity product, AWS token, Cognito user pool, or IAM token is implemented. The validator should clarify whether “AWS token” means Amazon Cognito; it is not applicable unless the project deliberately replaces Supabase Auth.

## 2. Deployment Strategy

### Current chosen setup

| Layer | Deployment | Rationale |
|---|---|---|
| Frontend | Vercel | CDN-served static React build; preview deployments per branch. |
| API | Render web service | Managed HTTPS service for FastAPI with health checks and environment variables. |
| Identity and database | Supabase Auth + PostgreSQL | Managed authentication and PostgreSQL with connection pooling. |

The operational setup steps are in `staging_deployment_guide.md`. Production must use separate Supabase, Render, and Vercel projects/environment variables from staging.

### Scaling decision

The frontend scales horizontally through Vercel's CDN. The FastAPI service is stateless: session identity is carried in Supabase access tokens and persistent data is in Supabase PostgreSQL, so additional API instances can serve traffic behind the platform load balancer (**horizontal scaling**). The first response to higher sustained load should be a larger API plan/instance and higher database resources (**vertical scaling**); then add API instances when CPU, memory, or request latency measurements show one instance is insufficient.

For the capstone/UAT workload, one Render API instance and Supabase pooling are appropriate. A production rollout requires monitoring, managed backups, automatic migration execution, health checks, alerts, and documented rollback before scaling traffic.

## 3. System Design, Methodology, Zoom, and Storyboard

- Architecture: `appendices/SYSTEM_ARCHITECTURE_DIAGRAM.md`
- User/system flow: `appendices/SYSTEM_FLOWCHART.md`
- Presentation storyboard: `appendices/INDUSTRY_PRESENTATION_STORYBOARD.md`
- Development method: Scrum was used as an iterative process: backlog refinement → sprint planning → implementation → review/demo → retrospective and backlog update. Sprint artifacts must identify the date, members, goal, completed work, feedback, and next sprint items; do not fabricate past sprint records.

The web layout is responsive rather than fixed. Before presentation or UAT, test all core flows at 100%, 125%, 150%, and 200% browser zoom on a desktop viewport and at 320 px/768 px mobile widths. Record pass/fail, browser, viewport, route, and issue found.

## 4. Validation Record

The About Us page identifies the psychology consultant, IT questionnaire validator, adviser, qualifications/roles, and each review scope. Claims must remain scoped to what each validator actually reviewed. System or questionnaire results must identify the validator and the exact instrument/component reviewed; unreviewed project-specific thresholds must be labeled as pending validation.

## 5. Feature Validation Checklist

- **Streak:** Create activity on consecutive calendar days, confirm the count increases once per day, remains active through the following day, and resets after a gap greater than one day.
- **Pet nickname:** Save, refresh, log out/in, then use another browser/device to confirm the authenticated profile’s nickname remains correct. Test blank input to restore the pet’s default name.
- **Security:** Confirm logout blocks protected routes, expired access tokens cause logout, and the password-reset flow follows the protocol above.
