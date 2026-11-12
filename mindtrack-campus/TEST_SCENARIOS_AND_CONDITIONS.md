# MindCare — QA Test Scenarios & Test Conditions Specification

**Project:** MindCare – Web-Based Mental Wellness Monitoring and Student Support System  
**Institution:** Polytechnic University of the Philippines – Santa Maria Campus  
**Version:** 1.0  
**Target Audience:** QA Engineers, Test Designers, and Capstone Teammates  
**Reference Document:** [`TEST_PLAN.md`](./TEST_PLAN.md)  
**Output Purpose:** High-level blueprint for writing concrete test cases (test steps, test data, and pass/fail criteria).

---

## Guide for QA Teammates

### Definitions
- **Test Scenario (TS):** A high-level description of what functionality, workflow, or user capability needs to be tested ("what to test").
- **Test Condition (TCond):** A specific state, input criteria, constraint, boundary, or business rule that must be validated within a scenario ("what condition to verify").
- **Writing Test Cases from this Document:** For each Test Condition, your test case should specify:
  1. **Pre-conditions** (e.g., user logged in as Student, active consent signed, database seeded)
  2. **Test Steps** (step-by-step user or API actions)
  3. **Test Data** (payloads, inputs, boundary values, role tokens)
  4. **Expected Result** (status codes, UI changes, database/audit assertions)

---

## Summary of Test Scenario Coverage

| Scenario ID | Module / Feature Area | Target Persona / Layer |
|-------------|-----------------------|------------------------|
| `TS-AUTH` | Authentication, Registration & Session Lifecycle | Student / Admin / Supabase Auth |
| `TS-RBAC` | Role-Based Access Control & Route Authorization | Student / Admin / Backend Middleware |
| `TS-CONSENT` | Informed Consent Gate & Regulatory Compliance | Student / Consent Dependency |
| `TS-PHQ9` | PHQ-9 Standardized Depression Screening | Student / Scoring Engine |
| `TS-GAD7` | GAD-7 Standardized Anxiety Screening | Student / Scoring Engine |
| `TS-CHECKIN` | Daily Mood Tracking & Wellness Check-Ins | Student / Repository |
| `TS-JOURNAL` | Reflective Journaling, Encryption & NLP Sentiment | Student / Encryption & NLP Engine |
| `TS-MANTRA` | Mantra Wall (Posting, Filtering, Reporting & Moderation) | Student / Admin / Moderation Engine |
| `TS-NOTIF` | System Notifications & Event-Triggered Alerts | Student / Notification Service |
| `TS-PRIVACY` | Student Privacy Preferences & Data Anonymization | Student / Data Filtering |
| `TS-RESOURCE` | Wellness Resources & Support Directories | Student / Admin CRUD |
| `TS-ADMIN-OPS`| Admin Overview Dashboard & Operational Analytics | Administrator |
| `TS-ADMIN-WELL`| Admin Aggregated Wellness Analytics & Cohort Thresholds | Administrator / Analytics Engine |
| `TS-AUDIT` | System Audit Trails & Activity Logging | Administrator / Security Audit |
| `TS-RATE` | API Rate Limiting & Abuse Prevention | SlowAPI Middleware / Public Routes |
| `TS-COMPANION`| Interactive Companion Pet & Gamified Streaks | Student / Client & Profile State |
| `TS-PROFILE` | Student Onboarding & Academic Profile Management | Student / Profile Service |
| `TS-SEC-NFR` | Non-Functional Security, Privacy & Compliance | Cross-Cutting / All Endpoints |
| `TS-UI-NFR` | Accessibility (WCAG 2.1 AA) & Responsiveness | Cross-Cutting / Frontend |

---

## 1. Authentication & Session Management (`TS-AUTH`)

### Scenario TS-AUTH-01: User Login & Session Establishment
Verify that valid and invalid credentials for both student and administrative roles are properly processed by Supabase Auth and token sessions are securely established.

- **TCond-AUTH-01-A (Valid Student):** Existing student credentials return valid JWT, establish session, and navigate to `/dashboard`.
- **TCond-AUTH-01-B (Valid Admin):** Existing admin credentials return valid JWT, establish session, and navigate to `/admin`.
- **TCond-AUTH-01-C (Incorrect Password):** Valid registered email with invalid password returns standard error; session is rejected.
- **TCond-AUTH-01-D (Unregistered Email):** Non-existent account attempt returns user-friendly rejection without leaking user existence.
- **TCond-AUTH-01-E (Session Persistence):** Active session persists across hard browser reloads (`F5`) and tab duplicates.
- **TCond-AUTH-01-F (Explicit Logout):** Clicking logout terminates local session storage/cookies and redirects to `/login`.

### Scenario TS-AUTH-02: Student Account Registration & Validation
Verify that new student accounts adhere to input validations, password strength rules, and unique constraints.

- **TCond-AUTH-02-A (Valid Registration):** Unique email and compliant password register successfully and trigger initial profile creation.
- **TCond-AUTH-02-B (Duplicate Email):** Attempting registration with an already-registered email returns a duplicate account notification.
- **TCond-AUTH-02-C (Malformed Email):** Inputs missing `@` or domain return client-side and backend 422 validation errors.
- **TCond-AUTH-02-D (Weak Password):** Passwords not meeting complexity/length policies are blocked before submission.

### Scenario TS-AUTH-03: Self-Service Password Recovery
Verify password reset workflows via secure email tokens.

- **TCond-AUTH-03-A (Request Reset Link):** Submitting registered email triggers recovery email via Supabase/SMTP.
- **TCond-AUTH-03-B (Token Consumption):** Valid recovery token opens password change form and accepts new valid password.
- **TCond-AUTH-03-C (Expired/Tampered Token):** Expired or modified reset token is rejected with an invalid-link notification.

### Scenario TS-AUTH-04: Safe User Profile Identity (`GET /api/v1/auth/me`)
Verify that token validation on the backend resolves the safe profile data.

- **TCond-AUTH-04-A (Valid Token):** Returns HTTP 200 with user ID, email, role, academic profile, and companion pet details.
- **TCond-AUTH-04-B (Missing Token):** Unauthenticated request returns HTTP 401 Unauthorized.
- **TCond-AUTH-04-C (Forged Token):** Invalid or garbage JWT header returns HTTP 401 Unauthorized.
- **TCond-AUTH-04-D (Role Immutability):** Profile retrieval does not inadvertently overwrite an existing admin role with default student.

---

## 2. Role-Based Access Control (RBAC) & Authorization (`TS-RBAC`)

### Scenario TS-RBAC-01: Server-Side Administrative Protection
Verify that all administrative endpoints enforce strict role verification on the server side, irrespective of client-side navigation.

- **TCond-RBAC-01-A (Student Accessing Admin Route):** Student token hitting `/api/v1/admin/*` yields HTTP 403 Forbidden.
- **TCond-RBAC-01-B (Admin Accessing Admin Route):** Admin token hitting `/api/v1/admin/*` yields HTTP 200 OK.
- **TCond-RBAC-01-C (Unauthenticated on Admin Route):** Missing token hitting `/api/v1/admin/*` yields HTTP 401 Unauthorized (auth precedes RBAC).
- **TCond-RBAC-01-D (Student-Only Routes for Admin):** Admin token hitting student-exclusive routes (e.g., student-specific check-ins) is rejected with HTTP 403 Forbidden.

### Scenario TS-RBAC-02: Client-Side Navigation & Route Guards
Verify that UI layouts and navigation trees dynamically adapt to user roles.

- **TCond-RBAC-02-A (Student View):** Admin navigation items (Analytics, Moderation, Audit Logs) are hidden from navbar/sidebar.
- **TCond-RBAC-02-B (Admin View):** Student wellness logging tools (Check-in, Journal) are omitted from administrative navbar.
- **TCond-RBAC-02-C (Direct URL Manipulation):** Manually typing `/admin` in the browser while logged in as a student triggers redirect to unauthorized/dashboard page.

---

## 3. Informed Consent Gate & Compliance (`TS-CONSENT`)

### Scenario TS-CONSENT-01: Enforcement of Consent Requirement
Verify that sensitive student wellness processing requires active, current-version consent.

- **TCond-CONSENT-01-A (Unconsented Student Access):** Student without active consent attempting assessments, journals, or check-ins receives HTTP 403 Forbidden ("Active informed consent is required").
- **TCond-CONSENT-01-B (Consented Student Access):** Student with recorded consent version matching `CURRENT_CONSENT_VERSION` passes smoothly (HTTP 200/201).
- **TCond-CONSENT-01-C (Outdated Consent Version):** Student having consent under older version is gated until agreeing to latest version.
- **TCond-CONSENT-01-D (Admin Exemption):** Administrative routes are not subject to the student consent gate.

### Scenario TS-CONSENT-02: Consent Recording Workflow
Verify user interaction with the consent agreement UI.

- **TCond-CONSENT-02-A (Consent Modal Display):** First-time student is presented with consent modal outlining data practices before initial wellness activity.
- **TCond-CONSENT-02-B (Consent Submission):** Agreeing to terms submits `POST /api/v1/consent` and unblocks student features immediately.

---

## 4. Standardized PHQ-9 Screening Assessment (`TS-PHQ9`)

### Scenario TS-PHQ9-01: PHQ-9 Question Retrieval
Verify that standard 9 screening questions and 4-point response scales are served accurately.

- **TCond-PHQ9-01-A (Question Scale):** Responses retrieve exactly 9 standardized items with scale values 0 to 3 ("Not at all" to "Nearly every day").

### Scenario TS-PHQ9-02: PHQ-9 Scoring Logic & Severity Band Categorization
Verify the scoring algorithm and clinical severity classifications.

- **TCond-PHQ9-02-A (Minimal Depression):** Total score 0–4 yields `severity_band: "minimal"`, `escalated: false`.
- **TCond-PHQ9-02-B (Mild Depression):** Total score 5–9 yields `severity_band: "mild"`, `escalated: false`.
- **TCond-PHQ9-02-C (Moderate Depression):** Total score 10–14 yields `severity_band: "moderate"`.
- **TCond-PHQ9-02-D (Moderately Severe Depression):** Total score 15–19 yields `severity_band: "moderately_severe"`.
- **TCond-PHQ9-02-E (Severe Depression):** Total score 20–27 yields `severity_band: "severe"`, `escalated: true`.
- **TCond-PHQ9-02-F (Item 9 Suicide/Self-Harm Flag):** Any score &gt; 0 on Question 9 (item 9 &ge; 1) forces `escalated: true`, even if total score falls in a minimal or mild range.

### Scenario TS-PHQ9-03: PHQ-9 Validation & Privacy Boundaries
Verify data validation and ensure raw clinical scores are shielded from client responses.

- **TCond-PHQ9-03-A (Incomplete Submission):** Submitting fewer or more than 9 items returns HTTP 422 Unprocessable Entity.
- **TCond-PHQ9-03-B (Out-of-Range Value):** Response values &lt; 0 or &gt; 3 return HTTP 422.
- **TCond-PHQ9-03-C (No Diagnostic Label):** Response body presents qualitative wellness feedback and severity category, never clinical diagnoses.
- **TCond-PHQ9-03-D (Raw Score Shielding):** Client response payload omits `total_score` to prevent diagnostic labeling by the client.

### Scenario TS-PHQ9-04: PHQ-9 History & IDOR Protection
Verify retrieval of historical screenings and strict user data isolation.

- **TCond-PHQ9-04-A (History Retrieval):** Authenticated student retrieves their own past submissions ordered chronologically.
- **TCond-PHQ9-04-B (Cross-User IDOR Attempt):** Student A requesting Student B's assessment result ID receives HTTP 404 Not Found (not 403, preventing ID probing).

---

## 5. Standardized GAD-7 Screening Assessment (`TS-GAD7`)

### Scenario TS-GAD7-01: GAD-7 Scoring & Evaluation Thresholds
Verify anxiety screening logic and clinical evaluation recommendation triggers.

- **TCond-GAD7-01-A (Minimal Anxiety):** Total score 0–4 yields `severity_band: "minimal"`, `recommend_further_evaluation: false`.
- **TCond-GAD7-01-B (Mild Anxiety):** Total score 5–9 yields `severity_band: "mild"`, `recommend_further_evaluation: false`.
- **TCond-GAD7-01-C (Moderate Anxiety):** Total score 10–14 yields `severity_band: "moderate"`, `recommend_further_evaluation: true` (threshold &ge; 10).
- **TCond-GAD7-01-D (Severe Anxiety):** Total score 15–21 yields `severity_band: "severe"`, `escalated: true`, `recommend_further_evaluation: true`.
- **TCond-GAD7-01-E (Item Count Enforcement):** Submissions not containing exactly 7 integer values (0–3) are rejected with HTTP 422.

### Scenario TS-GAD7-02: GAD-7 Data Isolation & Results View
Verify results delivery and tenant isolation.

- **TCond-GAD7-02-A (Result Presentation):** Student views qualitative feedback emphasizing self-care and professional campus resources.
- **TCond-GAD7-02-B (Cross-Student Access Block):** Directly probing another user's GAD-7 result ID yields HTTP 404 Not Found.

---

## 6. Daily Wellness Check-ins (`TS-CHECKIN`)

### Scenario TS-CHECKIN-01: Check-in Submission & Input Boundaries
Verify daily mood tracking entries.

- **TCond-CHECKIN-01-A (Valid Check-in):** Valid `mood_score` (1 to 5 scale) with optional short note returns HTTP 201 Created.
- **TCond-CHECKIN-01-B (Invalid Mood Score):** Scores &lt; 1 or &gt; 5 or non-numeric types return HTTP 422.
- **TCond-CHECKIN-01-C (Note Length Limits):** Optional text notes exceeding maximum allowed characters (e.g., &gt; 500 chars) return HTTP 422.
- **TCond-CHECKIN-01-D (Empty Note):** Submitting a mood score with `null` or empty note succeeds without errors.

### Scenario TS-CHECKIN-02: Check-in History & Progression
Verify student tracking visualization over time.

- **TCond-CHECKIN-02-A (History Retrieval):** Student retrieves historical check-in list ordered by date.
- **TCond-CHECKIN-02-B (Dashboard Integration):** Latest mood score updates student dashboard companion mood state.
- **TCond-CHECKIN-02-C (User Data Separation):** Check-in history never includes data from other students.

---

## 7. Personal Journaling, Encryption & NLP Sentiment (`TS-JOURNAL`)

### Scenario TS-JOURNAL-01: Journal Lifecycle (CRUD)
Verify personal reflection journaling functions.

- **TCond-JOURNAL-01-A (Creation):** Valid journal text returns HTTP 201 Created and updates student journal list.
- **TCond-JOURNAL-01-B (Empty Content Validation):** Empty string or whitespace-only content is rejected with HTTP 422.
- **TCond-JOURNAL-01-C (Retrieval by ID):** Student retrieves their own decrypted journal entry.
- **TCond-JOURNAL-01-D (Update):** Student edits existing entry; record updates with new timestamp.
- **TCond-JOURNAL-01-E (Hard Delete):** Deleting entry returns HTTP 204 No Content; record is permanently purged from DB.

### Scenario TS-JOURNAL-02: Application-Layer Data Encryption at Rest
Verify that journal content is encrypted prior to database persistence.

- **TCond-JOURNAL-02-A (Database Ciphertext):** Direct inspection of database row shows encrypted ciphertext, never plaintext.
- **TCond-JOURNAL-02-B (Transparent Decryption):** Authorized API request decrypts content accurately for the entry author.

### Scenario TS-JOURNAL-03: Asynchronous NLP Sentiment Analysis & Graceful Degradation
Verify that assistive sentiment analysis runs without blocking journal operations.

- **TCond-JOURNAL-03-A (Sentiment Classification):** Reflective text is analyzed and assigned appropriate sentiment labels (`positive`, `negative`, `uncertain`).
- **TCond-JOURNAL-03-B (Non-Fatal NLP Failure):** If NLP model throws an error, the journal entry creation **must still succeed** (HTTP 201); error is logged silently.
- **TCond-JOURNAL-03-C (No Plaintext in Analysis Table):** `journal_analysis` table stores only sentiment labels and confidence scores, never student text.
- **TCond-JOURNAL-03-D (PII Scrubbing):** Preprocessing removes email addresses, URLs, and excess whitespace prior to NLP evaluation.

### Scenario TS-JOURNAL-04: Journal IDOR Protection
Verify strict cross-user boundaries for private thoughts.

- **TCond-JOURNAL-04-A (Cross-User Read):** Probing another student's journal ID yields HTTP 404.
- **TCond-JOURNAL-04-B (Cross-User Update):** Modifying another student's journal ID yields HTTP 404.
- **TCond-JOURNAL-04-C (Cross-User Delete):** Deleting another student's journal ID yields HTTP 404.

---

## 8. Mantra Wall / Freedom Wall (`TS-MANTRA`)

### Scenario TS-MANTRA-01: Student Posting & Automated Content Filtering
Verify community board posting and automated safety mechanisms.

- **TCond-MANTRA-01-A (Positive Post Submission):** Wholesome/supportive post passes filter and enters `pending` or `approved` status.
- **TCond-MANTRA-01-B (Toxic/Distress Post Auto-Rejection):** Content flagged by content safety filter is automatically marked `rejected`.
- **TCond-MANTRA-01-C (Auto-Rejection Notification):** Student whose post was auto-rejected receives supportive system alert pointing to resources.
- **TCond-MANTRA-01-D (Anonymous Posting):** Selecting anonymous hides user profile details on public feed while preserving internal auditability.

### Scenario TS-MANTRA-02: Public Feed Visibility Rules
Verify what posts are rendered to students on the public wall.

- **TCond-MANTRA-02-A (Approved Only):** General students only see posts with `approved` status.
- **TCond-MANTRA-02-B (Rejected/Archived Hidden):** Removed or archived posts are never delivered to the student feed.
- **TCond-MANTRA-02-C (Author Visibility):** Authors can see their own submitted pending post status.

### Scenario TS-MANTRA-03: Community Reporting
Verify reporting of inappropriate community posts.

- **TCond-MANTRA-03-A (Submit Report):** Authenticated student reports a post with a reason category (HTTP 201).
- **TCond-MANTRA-03-B (Duplicate Report Protection):** Submitting multiple reports for the same post by the same user is handled idempotently.

### Scenario TS-MANTRA-04: Administrative Moderation Workflows
Verify moderator controls for approving, rejecting, and archiving posts.

- **TCond-MANTRA-04-A (Admin Post Queue):** Admin retrieves complete list of posts across all moderation statuses.
- **TCond-MANTRA-04-B (Approve Action):** Moderating post to `approved` publishes it to the wall and notifies author.
- **TCond-MANTRA-04-C (Reject Action):** Moderating post to `rejected` removes it from feed and notifies author.
- **TCond-MANTRA-04-D (Report Resolution):** Moderating a reported post automatically marks all associated pending reports as resolved.
- **TCond-MANTRA-04-E (Bulk Moderation):** Submitting bulk moderation action updates multiple posts in a single request.
- **TCond-MANTRA-04-F (Grouped Reports View):** Admin reports endpoint groups reports by post with counts.

---

## 9. System Notifications & Event Alerts (`TS-NOTIF`)

### Scenario TS-NOTIF-01: Notification Delivery & Read State Management
Verify in-app alerts triggered by system actions.

- **TCond-NOTIF-01-A (Fetch Notifications):** Student retrieves their notifications with unread indicators.
- **TCond-NOTIF-01-B (Filter Unread):** Parameter `unread_only=true` returns only unread items.
- **TCond-NOTIF-01-C (Mark as Read):** Patching `{id}/read` marks item read and decrements badge counter.
- **TCond-NOTIF-01-D (IDOR Protection):** Student cannot mark another user's notification as read (HTTP 404).

---

## 10. Student Privacy Settings & Data Governance (`TS-PRIVACY`)

### Scenario TS-PRIVACY-01: Privacy Toggle Management
Verify student consent preferences over data sharing and tracking.

- **TCond-PRIVACY-01-A (Retrieve Defaults):** Initial query returns default privacy flags (`allow_activity_tracking: true`, `anonymize_activity: false`).
- **TCond-PRIVACY-01-B (Update Settings):** Updating toggles persists immediately and returns updated schema.
- **TCond-PRIVACY-01-C (Payload User ID Injection):** Attempting to send someone else's `user_id` in request body is safely ignored; only token owner's settings update.
- **TCond-PRIVACY-01-D (Audit Logging):** Updating privacy settings triggers a `privacy_setting_changed` audit log.

### Scenario TS-PRIVACY-02: Backend Enforcement of Privacy Choices
Verify that frontend privacy flags actually govern backend analytics.

- **TCond-PRIVACY-02-A (Anonymize Active):** When `anonymize_activity: true`, individual user identifiers are decoupled from all aggregated wellness monitoring.
- **TCond-PRIVACY-02-B (Tracking Disabled):** When `allow_activity_tracking: false`, user activity counts are excluded from optional tracking metrics.

---

## 11. Wellness Resources Management (`TS-RESOURCE`)

### Scenario TS-RESOURCE-01: Resource Browsing & Access
Verify that students can discover verified wellness information.

- **TCond-RESOURCE-01-A (List Resources):** Students retrieve published articles, hotlines, and campus guidance.
- **TCond-RESOURCE-01-B (Emergency Contacts):** Professional campus support hotlines and contacts are clearly visible and pinned.

### Scenario TS-RESOURCE-02: Administrative Resource Management
Verify admin CRUD for wellness resources.

- **TCond-RESOURCE-02-A (Create Resource):** Admin posts new resource card (HTTP 201).
- **TCond-RESOURCE-02-B (Update Resource):** Admin edits existing resource content.
- **TCond-RESOURCE-02-C (Delete Resource):** Admin deletes resource; entry disappears from student view.
- **TCond-RESOURCE-02-D (Student Block):** Student attempting to create/modify/delete resources gets HTTP 403.

---

## 12. Administrative Dashboard & Operational Analytics (`TS-ADMIN-OPS`)

### Scenario TS-ADMIN-OPS-01: High-Level System Operational Metrics
Verify operational KPI statistics for system administrators.

- **TCond-ADMIN-OPS-01-A (Overview KPIs):** Returns student count, pending moderation count, total reports, and system activity tiles.
- **TCond-ADMIN-OPS-01-B (Audit Activity Timeline):** Returns audit log frequency grouped by day and action type.
- **TCond-ADMIN-OPS-01-C (Moderation Timeline):** Returns posts volume grouped by day and approval status.
- **TCond-ADMIN-OPS-01-D (Student Access Block):** Non-admin calling any operational analytics endpoint receives HTTP 403.

---

## 13. Admin Aggregated Wellness Analytics & Cohort Privacy (`TS-ADMIN-WELL`)

### Scenario TS-ADMIN-WELL-01: Aggregated Screening Metrics & Demographics
Verify cohort-level wellness monitoring without compromising student privacy.

- **TCond-ADMIN-WELL-01-A (Screening Averages):** Returns average PHQ-9 and GAD-7 scores by academic program, year level, or section.
- **TCond-ADMIN-WELL-01-B (Severity Distributions):** Returns percentage/count distribution across severity bands.
- **TCond-ADMIN-WELL-01-C (Historical Trend):** Returns longitudinal trend series for selected date range.
- **TCond-ADMIN-WELL-01-D (Dropdown Filter Data):** `filter-options` endpoint returns distinct programs, year levels, and sections based on existing student profiles.

### Scenario TS-ADMIN-WELL-02: Strict Minimum Cohort Privacy Threshold
Verify that small group sizes are masked to prevent identifying individual students.

- **TCond-ADMIN-WELL-02-A (Threshold Trigger - Under 5 Students):** When a filtered cohort contains fewer than `MIN_COHORT_SIZE` (default: 5 students), the response sets `cohort_hidden: true` and replaces all score averages with `null`.
- **TCond-ADMIN-WELL-02-B (Zero PII Exposure):** No response from any `/api/v1/admin/wellness/*` route ever contains student names, student IDs, emails, or raw assessment answers.
- **TCond-ADMIN-WELL-02-C (Audit of Admin Access):** Every administrative query to wellness analytics creates an `admin_action` audit event.

---

## 14. System Audit Trails & Activity Logging (`TS-AUDIT`)

### Scenario TS-AUDIT-01: Comprehensive Security & Operational Event Capture
Verify that sensitive events are reliably recorded for auditability.

- **TCond-AUDIT-01-A (Assessment Submission):** Submitting PHQ-9/GAD-7 logs `assessment_submission` with severity band metadata.
- **TCond-AUDIT-01-B (Journal Events):** Creating/deleting journal logs `journal_created` or `journal_deleted`.
- **TCond-AUDIT-01-C (Moderation Events):** Post moderation logs `mantra_wall_moderation` with actor ID and action.
- **TCond-AUDIT-01-D (Privacy Change Events):** Updating privacy settings logs `privacy_setting_changed`.

### Scenario TS-AUDIT-02: Audit Log Privacy & Protection
Verify that the audit log itself does not leak sensitive student reflections.

- **TCond-AUDIT-02-A (No Journal Text):** Journal contents are **never** written to audit log descriptions or metadata.
- **TCond-AUDIT-02-B (No Assessment Responses):** Raw survey answers (item-by-item) are omitted from audit records.
- **TCond-AUDIT-02-C (Admin-Only Audit Access):** Students accessing `/api/v1/admin/audit-logs` receive HTTP 403 Forbidden.

---

## 15. API Rate Limiting & Abuse Prevention (`TS-RATE`)

### Scenario TS-RATE-01: IP-Based Rate Limiting on Sensitive Endpoints
Verify abuse prevention on sensitive endpoints using SlowAPI.

- **TCond-RATE-01-A (Within Threshold):** Up to 30 requests per minute to `/api/v1/auth/me` succeed with HTTP 200.
- **TCond-RATE-01-B (Exceeding Threshold):** Request #31 within the 60-second window receives HTTP 429 Too Many Requests.
- **TCond-RATE-01-C (Window Recovery):** After the rate limit window elapses, subsequent requests succeed normally.

---

## 16. Student Dashboard, Activity Streaks & Companion Pet (`TS-COMPANION`)

### Scenario TS-COMPANION-01: Companion Pet Visualization & State Shifts
Verify student companion rendering and emotional state reactivity.

- **TCond-COMPANION-01-A (Selected Pet Rendering):** Chosen pet (e.g., axolotl, capybara, red panda, dog, cat) renders correctly.
- **TCond-COMPANION-01-B (Mood State Reactivity):** Companion animation transitions between `idle`, `happy`, and `sleeping` based on activity or time of day.
- **TCond-COMPANION-01-C (Custom Nickname):** Custom pet nickname saved in profile is displayed above the avatar.
- **TCond-COMPANION-01-D (Poke/Click Interaction):** Clicking the companion triggers momentary playful poke interaction.

### Scenario TS-COMPANION-02: Activity Streak Tracking
Verify gamified streak calculation.

- **TCond-COMPANION-02-A (Daily Streak Increment):** Performing daily check-in or assessment increments streak counter by 1.
- **TCond-COMPANION-02-B (Streak Maintenance):** Multiple activities on the same day maintain the streak without duplicate increments.

---

## 17. Student Onboarding & Academic Profile Management (`TS-PROFILE`)

### Scenario TS-PROFILE-01: First-Time Onboarding Experience
Verify initial setup flow for new student accounts.

- **TCond-PROFILE-01-A (Automatic Onboarding Trigger):** Freshly registered user is directed to onboarding before dashboard access.
- **TCond-PROFILE-01-B (Academic Metadata Collection):** Student enters Year Level, Program (e.g., BSIT), and Section.
- **TCond-PROFILE-01-C (Companion Pet Selection):** Student picks starting companion pet and optional nickname.
- **TCond-PROFILE-01-D (Onboarding Completion):** Finishing onboarding saves profile data and marks onboarding complete; subsequent logins bypass it.

### Scenario TS-PROFILE-02: Profile Updating
Verify editing student profile attributes.

- **TCond-PROFILE-02-A (Update Academic Details):** Student updates section/year level; new values reflect across system.
- **TCond-PROFILE-02-B (Change Companion Pet):** Switching companion updates avatar across all student views.

---

## 18. Cross-Cutting Non-Functional Scenarios (`TS-SEC-NFR` & `TS-UI-NFR`)

### Scenario TS-SEC-NFR-01: Web Security & Injection Defenses
Verify application resilience against standard web attack vectors.

- **TCond-SEC-01-A (SQL Injection via Path):** SQL syntax in UUID path parameters (e.g., `'; DROP TABLE...`) returns 422 or 401, never 500.
- **TCond-SEC-01-B (SQL Injection via Body):** SQL statements inside journal or post text are safely parameterized by SQLAlchemy and stored as harmless literal strings.
- **TCond-SEC-01-C (XSS Defense in Mantra Wall):** Submitting HTML/JavaScript tags (e.g., `<script>alert(1)</script>`) is sanitized or escaped upon display.
- **TCond-SEC-01-D (Oversized Payloads):** Abnormally large text bodies (&gt; 10,000 characters) are rejected by schema validators with HTTP 422.

### Scenario TS-UI-NFR-01: Accessibility Standards (WCAG 2.1 Level AA)
Verify inclusive design compliance across client interfaces.

- **TCond-UI-01-A (Keyboard Only Navigation):** Complete workflows (login, check-in, assessment) are executable using only `Tab`, `Shift+Tab`, `Space`, and `Enter`.
- **TCond-UI-01-B (Focus Visibility):** Focus rings remain visible on all interactive buttons, radios, and inputs.
- **TCond-UI-01-C (Color Contrast):** Both Light and Dark theme modes maintain at least 4.5:1 text-to-background contrast ratio.
- **TCond-UI-01-D (Screen Reader Semantics):** Form controls have accessible labels and error messages are announced to assistive technology.

### Scenario TS-UI-NFR-02: Multi-Device Responsive Layouts
Verify responsive breakpoints without visual degradation.

- **TCond-UI-02-A (Mobile Viewport - 375px):** No horizontal page scrolling; navigation shifts to mobile drawer; cards stack cleanly.
- **TCond-UI-02-B (Tablet Viewport - 768px):** Two-column grid layouts render proportionally.
- **TCond-UI-02-C (Desktop Viewport - 1366px / 1920px):** Layout utilizes space effectively with persistent sidebar navigation.

---

## Next Steps for QA Teammates

1. **Map to Test Cases:** Select a Scenario ID (e.g., `TS-PHQ9-02`) and draft individual test cases in your test management tool (e.g., Jira / Excel / TestRail).
2. **Assign Test Data:** Use synthetic test accounts (e.g., `student1@pup.edu.ph`, `admin@pup.edu.ph`). **Never use real student data.**
3. **Execute in Order:** Follow the phases outlined in Section 12 of [`TEST_PLAN.md`](./TEST_PLAN.md) (Auth &rarr; RBAC &rarr; Core Features &rarr; Admin &rarr; Security).
4. **Log Defects:** Reference the Scenario ID and Condition ID when logging issues in bug trackers (e.g., `Defect in TCond-MANTRA-04-D: Reports not auto-resolving`).

