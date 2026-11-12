# MindCare — QA Test Plan

**Project:** MindCare – Web-Based Mental Wellness Monitoring and Student Support System  
**Institution:** Polytechnic University of the Philippines – Santa Maria Campus  
**Version:** 1.0  
**Date:** November 9, 2026  
**Prepared by:** Development Team  
**Handed to:** QA Team  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope](#2-scope)
3. [Test Objectives](#3-test-objectives)
4. [Test Environment](#4-test-environment)
5. [Test Strategy](#5-test-strategy)
6. [Test Modules & Test Cases](#6-test-modules--test-cases)
   - [6.1 Authentication & Session Management](#61-authentication--session-management)
   - [6.2 Role-Based Access Control (RBAC)](#62-role-based-access-control-rbac)
   - [6.3 Consent Gate](#63-consent-gate)
   - [6.4 PHQ-9 Assessment](#64-phq-9-assessment)
   - [6.5 GAD-7 Assessment](#65-gad-7-assessment)
   - [6.6 Wellness Check-ins (Daily Mood)](#66-wellness-check-ins-daily-mood)
   - [6.7 Journal (CRUD + NLP Analysis)](#67-journal-crud--nlp-analysis)
   - [6.8 Mantra Wall (Freedom Wall)](#68-mantra-wall-freedom-wall)
   - [6.9 Notifications](#69-notifications)
   - [6.10 Privacy Settings](#610-privacy-settings)
   - [6.11 Wellness Resources](#611-wellness-resources)
   - [6.12 Admin Dashboard & Analytics](#612-admin-dashboard--analytics)
   - [6.13 Admin Moderation](#613-admin-moderation)
   - [6.14 Audit Logs](#614-audit-logs)
   - [6.15 Rate Limiting](#615-rate-limiting)
   - [6.16 Student Dashboard & Companion Pet](#616-student-dashboard--companion-pet)
   - [6.17 Profile Management](#617-profile-management)
   - [6.18 Onboarding Flow](#618-onboarding-flow)
7. [Non-Functional Testing](#7-non-functional-testing)
   - [7.1 Security Testing](#71-security-testing)
   - [7.2 Performance Testing](#72-performance-testing)
   - [7.3 Accessibility Testing](#73-accessibility-testing)
   - [7.4 Responsiveness Testing](#74-responsiveness-testing)
8. [Regression Testing](#8-regression-testing)
9. [Entry & Exit Criteria](#9-entry--exit-criteria)
10. [Test Deliverables](#10-test-deliverables)
11. [Defect Classification](#11-defect-classification)
12. [Test Schedule](#12-test-schedule)

---

## 1. Introduction

This document defines the test plan for the MindCare system, a privacy-conscious web-based wellness monitoring and student support platform. MindCare is **not a diagnostic or clinical system** — it is a monitoring, awareness, and resource-access tool. All test cases must be evaluated with this boundary in mind.

The system is built on a **React + TypeScript + Vite** frontend, a **FastAPI (Python)** backend, and a **Supabase-hosted PostgreSQL** database. Authentication is handled by **Supabase Auth** with JWT tokens propagated to the backend.

---

## 2. Scope

### In Scope
- All student-facing features (dashboard, assessments, journal, check-ins, mantra wall, resources, notifications, privacy settings, profile, companion pet)
- All admin-facing features (dashboard, analytics, wellness analytics, moderation, audit logs, resource management)
- Backend API endpoints (`/api/v1/...`)
- Authentication, session management, RBAC, and consent gate enforcement
- Rate limiting behavior
- NLP journal sentiment analysis (non-clinical, assistive)
- UI responsiveness and accessibility
- Cross-browser compatibility

### Out of Scope
- Clinical accuracy of PHQ-9 or GAD-7 scoring (subject to professional expert validation, not QA)
- Production infrastructure and deployment pipeline
- External SMTP email delivery internals
- Supabase authentication internals (third-party service)

---

## 3. Test Objectives

1. Verify that all user-facing features function correctly end-to-end for both Student and Admin roles.
2. Confirm that the backend enforces authorization — not just the frontend — for every protected route.
3. Validate that the consent gate (`require_consent`) correctly blocks access to wellness features when no active consent exists.
4. Verify that NLP journal analysis failures are non-fatal and do not break journal creation.
5. Confirm that the Mantra Wall content filter, moderation workflow, and notifications function correctly.
6. Confirm that admin analytics return only aggregate data with no individual student identifiers.
7. Validate rate limiting on sensitive endpoints.
8. Verify that privacy settings are backend-enforced, not frontend-only.
9. Ensure the UI is responsive, accessible, and supports both light and dark themes.

---

## 4. Test Environment

| Item | Details |
|------|---------|
| **Backend** | FastAPI + Uvicorn, Python 3.12/3.14 |
| **Frontend** | React 18 + TypeScript + Vite |
| **Database** | Supabase PostgreSQL (test project / staging instance) |
| **Auth** | Supabase Auth (JWT) |
| **Backend URL** | `http://localhost:8000` (local) |
| **Frontend URL** | `http://localhost:5173` (local dev) |
| **Test Browsers** | Chrome (latest), Firefox (latest), Edge (latest) |
| **Devices** | Desktop (1920×1080), Laptop (1366×768), Tablet (768px), Mobile (375px) |
| **Backend Test Runner** | Pytest |
| **Frontend Test Runner** | Vitest + React Testing Library |
| **API Testing Tool** | Postman / FastAPI Swagger UI (`/docs`) |
| **Existing Unit Tests** | `backend/tests/` — 20+ test files covering all modules |

> [!IMPORTANT]
> Use a **dedicated test Supabase project** or a **staging database**. Never run tests against the production database.

---

## 5. Test Strategy

### Testing Levels

| Level | Approach |
|-------|---------|
| **Unit Tests** | Run existing Pytest suite (`backend/tests/`) against all backend modules |
| **API Tests** | Manual + Postman collection against all REST endpoints |
| **Integration Tests** | Backend + DB integration via `backend/tests/integration/` |
| **Frontend Component Tests** | Vitest + React Testing Library |
| **End-to-End Tests** | Manual walkthrough of full user journeys per role |
| **Security Tests** | Authorization bypass attempts, JWT tampering, IDOR probing |
| **Non-Functional Tests** | Performance, accessibility (WCAG 2.1 AA), responsiveness |

### Test ID Convention
```
TC-[MODULE]-[NUMBER]
Example: TC-AUTH-001, TC-PHQ9-003, TC-RBAC-002
```

### Status Codes Used
- ✅ **Pass** — Feature works as expected
- ❌ **Fail** — Defect found
- ⚠️ **Partial** — Works with caveats
- ⏭️ **Skip** — Out of scope / blocked by dependency

---

## 6. Test Modules & Test Cases

---

### 6.1 Authentication & Session Management

**Reference:** `backend/app/api/routes/auth.py`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/CreateAccount.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-AUTH-001 | Successful student login | Enter valid student credentials → Submit | Redirect to Student Dashboard; JWT stored in session | High |
| TC-AUTH-002 | Successful admin login | Enter valid admin credentials → Submit | Redirect to Admin Dashboard | High |
| TC-AUTH-003 | Login with wrong password | Enter valid email + wrong password → Submit | Error message shown; no session created | High |
| TC-AUTH-004 | Login with unregistered email | Enter unknown email → Submit | Appropriate error message; no crash | High |
| TC-AUTH-005 | Account creation — valid data | Fill all fields correctly → Submit | Account created; redirected to onboarding | High |
| TC-AUTH-006 | Account creation — duplicate email | Enter already-registered email → Submit | Error: email already in use | Medium |
| TC-AUTH-007 | Account creation — invalid email format | Enter malformed email → Submit | Validation error shown | Medium |
| TC-AUTH-008 | Forgot password flow | Enter registered email → Submit → Check email | Reset link sent (email confirmed) | Medium |
| TC-AUTH-009 | Password reset with valid token | Follow reset link → Enter new password → Submit | Password updated; can log in with new password | Medium |
| TC-AUTH-010 | Access protected route without token | Navigate to `/dashboard` without login | Redirect to login page | High |
| TC-AUTH-011 | `GET /api/v1/auth/me` — authenticated | Call endpoint with valid JWT | Returns user profile (id, email, role, etc.) | High |
| TC-AUTH-012 | `GET /api/v1/auth/me` — unauthenticated | Call endpoint with no token | `401 Unauthorized` | High |
| TC-AUTH-013 | `GET /api/v1/auth/me` — rate limit | Send 31+ requests/minute from same IP | `429 Too Many Requests` on 31st request | Medium |
| TC-AUTH-014 | Session persistence on page refresh | Log in → Refresh page | Remains logged in; session not lost | Medium |
| TC-AUTH-015 | Logout | Click Logout | Session cleared; redirected to login | High |

---

### 6.2 Role-Based Access Control (RBAC)

**Reference:** `backend/app/security/rbac.py`

> [!IMPORTANT]
> These tests must be run against the **backend API directly** (not via the frontend) to confirm server-side enforcement.

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-RBAC-001 | Student accesses admin-only endpoint | Use student JWT → `GET /api/v1/admin/analytics/overview` | `403 Forbidden` | Critical |
| TC-RBAC-002 | Admin accesses student-only endpoint | Use admin JWT → `POST /api/v1/journals` | `403 Forbidden` (admin is not a student) | High |
| TC-RBAC-003 | Unauthenticated access to admin endpoint | No JWT → `GET /api/v1/admin/analytics/overview` | `401 Unauthorized` | Critical |
| TC-RBAC-004 | Admin-check route accessible to admin | Admin JWT → `GET /api/v1/auth/admin-check` | `200 OK` with confirmation message | Low |
| TC-RBAC-005 | Admin-check route blocked for student | Student JWT → `GET /api/v1/auth/admin-check` | `403 Forbidden` | High |
| TC-RBAC-006 | Frontend hides admin nav for students | Log in as student | No admin navigation links visible | Medium |
| TC-RBAC-007 | Frontend hides student nav for admins | Log in as admin | Student-only pages (Journal, etc.) not in nav | Medium |
| TC-RBAC-008 | Direct URL navigation by wrong role | Student navigates to `/admin` manually | Redirect to student dashboard or 403 page | High |

---

### 6.3 Consent Gate

**Reference:** `backend/app/security/consent_gate.py`, `backend/app/api/routes/consent.py`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-CONSENT-001 | Access wellness feature without consent | Authenticated student (no consent) → `POST /api/v1/journals` | `403 Forbidden` — "Active informed consent is required" | Critical |
| TC-CONSENT-002 | Access wellness feature after consent granted | Grant consent → `POST /api/v1/journals` | `201 Created` | Critical |
| TC-CONSENT-003 | Consent required for PHQ-9 | No consent → `POST /api/v1/assessments/phq9` | `403 Forbidden` | Critical |
| TC-CONSENT-004 | Consent required for GAD-7 | No consent → `POST /api/v1/assessments/gad7` | `403 Forbidden` | Critical |
| TC-CONSENT-005 | Consent required for wellness check-ins | No consent → `POST /api/v1/wellness/checkins` | `403 Forbidden` | Critical |
| TC-CONSENT-006 | Grant consent — valid payload | `POST /api/v1/consent` with valid version | `201 Created`; consent record saved | High |
| TC-CONSENT-007 | Consent version mismatch | Old consent version exists; new version required | `403 Forbidden` until new version consented | High |
| TC-CONSENT-008 | Consent gate does not apply to admin routes | Admin JWT → admin endpoints | No consent check; admin proceeds | Medium |
| TC-CONSENT-009 | UI prompts consent on first login | Log in as new student → navigate to Journal | Consent modal/screen is shown before access | High |

---

### 6.4 PHQ-9 Assessment

**Reference:** `backend/app/api/routes/assessments.py`, `backend/app/services/phq9_service.py`, `frontend/src/pages/Assessments.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-PHQ9-001 | Fetch PHQ-9 questions | `GET /api/v1/assessments/phq9` | Returns 9 questions with response scale | High |
| TC-PHQ9-002 | Submit valid PHQ-9 (all responses 0–3) | Submit 9 valid integer responses | `201 Created`; returns `severity_band`, `qualitative_feedback`, `escalated` | High |
| TC-PHQ9-003 | Submit PHQ-9 — wrong number of responses | Submit 8 responses | `422 Unprocessable Entity` | High |
| TC-PHQ9-004 | Submit PHQ-9 — out-of-range value | Submit response with value `4` | `422 Unprocessable Entity` | High |
| TC-PHQ9-005 | Submit PHQ-9 — negative value | Submit response `-1` | `422 Unprocessable Entity` | Medium |
| TC-PHQ9-006 | Severity band: minimal (score 0–4) | Submit all 0s | `severity_band = "minimal"` | High |
| TC-PHQ9-007 | Severity band: moderate (score 10–14) | Submit responses summing to ~12 | `severity_band = "moderate"` | High |
| TC-PHQ9-008 | Severity band: severe (score ≥ 20) | Submit responses summing to 27 | `severity_band = "severe"`, `escalated = true` | Critical |
| TC-PHQ9-009 | View PHQ-9 history | Submit 2 assessments → `GET /api/v1/assessments/phq9/history` | Returns list of past results | High |
| TC-PHQ9-010 | View specific result | `GET /api/v1/assessments/phq9/{result_id}` | Returns correct result for that ID | Medium |
| TC-PHQ9-011 | Cannot access another student's result | Student A's result_id → Student B's token | `404 Not Found` | Critical |
| TC-PHQ9-012 | PHQ-9 audit log created on submit | Submit PHQ-9 | Audit log entry created with `assessment_submission` event | Medium |
| TC-PHQ9-013 | UI shows non-diagnostic language | Complete PHQ-9 → View result screen | No diagnostic language; qualitative feedback shown | High |
| TC-PHQ9-014 | UI: cannot submit without answering all questions | Leave one question blank → click Submit | Submit button disabled or validation message shown | High |

---

### 6.5 GAD-7 Assessment

**Reference:** `backend/app/api/routes/gad7.py`, `backend/app/services/gad7_service.py`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-GAD7-001 | Fetch GAD-7 questions | `GET /api/v1/assessments/gad7` | Returns 7 questions with response scale | High |
| TC-GAD7-002 | Submit valid GAD-7 | Submit 7 valid responses (0–3) | `201 Created`; returns result | High |
| TC-GAD7-003 | Submit GAD-7 — wrong count | Submit 6 responses | `422 Unprocessable Entity` | High |
| TC-GAD7-004 | Submit GAD-7 — out-of-range | Submit value `5` | `422 Unprocessable Entity` | High |
| TC-GAD7-005 | Severity band correctness | Submit responses summing to 15+ | Returns appropriate high-severity band | High |
| TC-GAD7-006 | View GAD-7 history | `GET /api/v1/assessments/gad7/history` | Returns historical list | Medium |
| TC-GAD7-007 | IDOR: access another student's GAD-7 result | Cross-token access of `{result_id}` | `404 Not Found` | Critical |
| TC-GAD7-008 | UI navigates to GAD-7 via location state | Navigate to Assessments with `type: 'GAD-7'` state | GAD-7 questions load correctly | Medium |

---

### 6.6 Wellness Check-ins (Daily Mood)

**Reference:** `backend/app/api/routes/wellness_checkins.py`, `frontend/src/pages/DailyCheckIn.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-CHECKIN-001 | Submit valid check-in | `POST /api/v1/wellness/checkins` with valid `mood_score` and `note` | `201 Created`; check-in stored | High |
| TC-CHECKIN-002 | Submit check-in — invalid mood score | `mood_score` outside valid range | `422 Unprocessable Entity` | High |
| TC-CHECKIN-003 | Submit check-in — note too long | Submit note exceeding max length | `422 Unprocessable Entity` | Medium |
| TC-CHECKIN-004 | Retrieve check-in history | `GET /api/v1/wellness/checkins` | Returns all check-ins for current user only | High |
| TC-CHECKIN-005 | Check-in list isolation | Student A's history not visible to Student B | Each student sees only their own data | Critical |
| TC-CHECKIN-006 | UI: mood picker interaction | Select different mood levels on UI | UI updates selection; submits correctly | Medium |
| TC-CHECKIN-007 | Companion pet reacts to mood | Submit happy mood | Pet animation state reflects positive mood | Low |

---

### 6.7 Journal (CRUD + NLP Analysis)

**Reference:** `backend/app/api/routes/journals.py`, `frontend/src/pages/Journal.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-JOURNAL-001 | Create journal entry | `POST /api/v1/journals` with content | `201 Created`; entry stored | High |
| TC-JOURNAL-002 | List journal entries | `GET /api/v1/journals` | Returns all entries for current user | High |
| TC-JOURNAL-003 | Get single journal entry | `GET /api/v1/journals/{id}` | Returns correct entry | High |
| TC-JOURNAL-004 | Update journal entry | `PUT /api/v1/journals/{id}` with new content | `200 OK`; content updated; re-analysis triggered | High |
| TC-JOURNAL-005 | Delete journal entry | `DELETE /api/v1/journals/{id}` | `204 No Content`; entry removed | High |
| TC-JOURNAL-006 | IDOR: access another student's journal | Student B uses Student A's `journal_id` | `404 Not Found` | Critical |
| TC-JOURNAL-007 | IDOR: delete another student's journal | Student B sends DELETE with Student A's ID | `404 Not Found` | Critical |
| TC-JOURNAL-008 | NLP analysis: get result | Create entry → `GET /api/v1/journals/{id}/analysis` | Returns `sentiment_label`, `is_uncertain`, `analyzed_at` | Medium |
| TC-JOURNAL-009 | NLP analysis: not yet available | Immediately after creation before analysis completes | `404` or analysis pending gracefully | Medium |
| TC-JOURNAL-010 | NLP failure is non-fatal | Simulate NLP service failure | Journal entry is still created; error logged but not raised | High |
| TC-JOURNAL-011 | Audit log on creation | Create journal | Audit log entry created (`journal_created`) | Medium |
| TC-JOURNAL-012 | Audit log on deletion | Delete journal | Audit log entry created (`journal_deleted`) | Medium |
| TC-JOURNAL-013 | Empty content rejected | Submit empty string as content | `422 Unprocessable Entity` | Medium |
| TC-JOURNAL-014 | UI: Create, view, edit, delete flow | Full journal CRUD via UI | All actions work; list updates in real time | High |

---

### 6.8 Mantra Wall (Freedom Wall)

**Reference:** `backend/app/api/routes/mantra_wall.py`, `frontend/src/pages/MantraWall.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-MANTRA-001 | Create post — passes content filter | Submit positive/neutral content | `201 Created`; `moderation_status = "pending"` or `"approved"` | High |
| TC-MANTRA-002 | Create post — fails content filter | Submit content triggering auto-rejection | `201 Created`; `moderation_status = "rejected"` | High |
| TC-MANTRA-003 | Auto-rejection triggers notification | Submit content that fails filter | Notification sent to author (auto_rejected type) | High |
| TC-MANTRA-004 | List visible posts (student) | `GET /api/v1/mantra-wall/posts` | Returns only approved posts | High |
| TC-MANTRA-005 | Report a post | `POST /api/v1/mantra-wall/posts/{id}/report` with reason | `201 Created`; report stored | Medium |
| TC-MANTRA-006 | Anonymous post display | Create post with `post_type = "anonymous"` | Author identity not shown on wall | High |
| TC-MANTRA-007 | Admin lists all posts | `GET /api/v1/admin/mantra-wall/posts` | Returns all posts regardless of status | High |
| TC-MANTRA-008 | Admin lists reports — flat | `GET /api/v1/admin/mantra-wall/reports` | Returns all reports | Medium |
| TC-MANTRA-009 | Admin lists reports — grouped | `GET /api/v1/admin/mantra-wall/reports/grouped` | One entry per reported post with count | Medium |
| TC-MANTRA-010 | Admin moderates post: approve | `PATCH /api/v1/admin/mantra-wall/posts/{id}/moderate` → `"approved"` | Post approved; notification sent to author | High |
| TC-MANTRA-011 | Admin moderates post: reject | Same endpoint → `"rejected"` | Post rejected; notification sent; audit logged | High |
| TC-MANTRA-012 | Admin moderates post: archive | Same endpoint → `"archived"` | Post archived; notification sent; audit logged | High |
| TC-MANTRA-013 | Moderation resolves open reports | Admin moderates post with open reports | Associated reports marked resolved | Medium |
| TC-MANTRA-014 | Bulk moderation | `POST /api/v1/admin/mantra-wall/bulk-moderate` with multiple post IDs | All posts moderated; audit logged for each | Medium |
| TC-MANTRA-015 | Student cannot access admin moderation endpoint | Student JWT → admin endpoint | `403 Forbidden` | Critical |
| TC-MANTRA-016 | Moderation audit log | Admin moderates post | Audit log created (`mantra_wall_moderation`) | Medium |

---

### 6.9 Notifications

**Reference:** `backend/app/api/routes/notifications.py`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-NOTIF-001 | List all notifications | `GET /api/v1/notifications` | Returns notifications for current user | High |
| TC-NOTIF-002 | List unread only | `GET /api/v1/notifications?unread_only=true` | Returns only unread notifications | Medium |
| TC-NOTIF-003 | Mark notification as read | `PATCH /api/v1/notifications/{id}/read` | Notification marked read; returned with updated state | Medium |
| TC-NOTIF-004 | Cannot read another user's notification | Use another user's notification ID | `404 Not Found` or `403 Forbidden` | Critical |
| TC-NOTIF-005 | Notification created on mantra wall action | Approve/reject/archive a post | Author receives notification | High |
| TC-NOTIF-006 | UI: Notification count badge | New notification arrives | Badge shows unread count | Medium |
| TC-NOTIF-007 | UI: Mark as read via UI | Click on notification | Marked as read; badge count decreases | Medium |

---

### 6.10 Privacy Settings

**Reference:** `backend/app/api/routes/privacy.py`, `frontend/src/pages/PrivacySettings.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-PRIVACY-001 | Get privacy settings | `GET /api/v1/privacy/settings` | Returns `allow_activity_tracking`, `anonymize_activity`, `updated_at` | High |
| TC-PRIVACY-002 | Default settings on first access | New student → get settings | Defaults returned (not null) | Medium |
| TC-PRIVACY-003 | Update privacy settings | `PUT /api/v1/privacy/settings` with new values | `200 OK`; updated settings returned | High |
| TC-PRIVACY-004 | Privacy settings audit log | Update settings | Audit log created (`privacy_setting_changed`) with new values | Medium |
| TC-PRIVACY-005 | Admin cannot access student privacy settings | Admin JWT → `GET /api/v1/privacy/settings` | `403 Forbidden` (admin is not a student) | High |
| TC-PRIVACY-006 | Backend enforces anonymize flag | Enable anonymize → check analytics | Identifying data excluded from admin analytics | High |
| TC-PRIVACY-007 | UI: Toggle updates backend | Toggle settings in UI → verify via API | Backend settings match UI state | High |

---

### 6.11 Wellness Resources

**Reference:** `backend/app/api/routes/resources.py`, `frontend/src/pages/Resources.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-RESOURCE-001 | List resources (student) | `GET /api/v1/resources` | Returns list of wellness resources | High |
| TC-RESOURCE-002 | Resource card renders correctly | View Resources page | Each resource shows title, description, and link/action | Medium |
| TC-RESOURCE-003 | Admin creates resource | Admin → `POST /api/v1/admin/resources` | Resource created and visible to students | Medium |
| TC-RESOURCE-004 | Admin updates resource | Admin → `PUT /api/v1/admin/resources/{id}` | Resource updated | Medium |
| TC-RESOURCE-005 | Admin deletes resource | Admin → `DELETE /api/v1/admin/resources/{id}` | Resource removed | Medium |
| TC-RESOURCE-006 | Student cannot create resource | Student JWT → `POST /api/v1/admin/resources` | `403 Forbidden` | High |

---

### 6.12 Admin Dashboard & Analytics

**Reference:** `backend/app/api/routes/admin_analytics.py`, `frontend/src/pages/AdminDashboard.tsx`, `AdminAnalytics.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-ADMIN-001 | Overview KPIs | `GET /api/v1/admin/analytics/overview` | Returns aggregated tile counts; no individual data | High |
| TC-ADMIN-002 | Audit timeline | `GET /api/v1/admin/analytics/audit-timeline?days=30` | Returns event counts grouped by day and type | Medium |
| TC-ADMIN-003 | Moderation timeline | `GET /api/v1/admin/analytics/moderation-timeline?days=30` | Returns post counts grouped by day and status | Medium |
| TC-ADMIN-004 | Wellness overview | `GET /api/v1/admin/wellness/overview` | Returns participation KPIs; no individual student identifiers | High |
| TC-ADMIN-005 | Wellness screening averages | `GET /api/v1/admin/wellness/screening` | Returns average PHQ-9/GAD-7 scores and distributions | High |
| TC-ADMIN-006 | Small cohort privacy | Filter to group with < 5 students | `cohort_hidden = true`; averages set to null | High |
| TC-ADMIN-007 | Wellness by group — program | `GET /api/v1/admin/wellness/by-group?group_by=program` | Returns breakdown by program | Medium |
| TC-ADMIN-008 | Wellness by group — year level | `GET .../by-group?group_by=year_level` | Returns breakdown by year level | Medium |
| TC-ADMIN-009 | Wellness trend (90-day default) | `GET /api/v1/admin/wellness/trend` | Returns daily time-series for trailing 90 days | Medium |
| TC-ADMIN-010 | Wellness trend with date filter | `GET .../trend?start_date=...&end_date=...` | Returns trend limited to specified range | Medium |
| TC-ADMIN-011 | Filter options endpoint | `GET /api/v1/admin/wellness/filter-options` | Returns distinct programs, year levels, sections | Medium |
| TC-ADMIN-012 | Analytics action is audit-logged | Access any analytics endpoint | Audit log entry created for `admin_action` | Medium |
| TC-ADMIN-013 | Student blocked from analytics | Student JWT → any admin analytics endpoint | `403 Forbidden` | Critical |
| TC-ADMIN-014 | Admin UI: KPI tiles display | Log in as admin → view dashboard | Tiles load with correct counts | Medium |

---

### 6.13 Admin Moderation

**Reference:** `frontend/src/pages/AdminModeration.tsx`, `AdminResourceManagement.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-MOD-001 | Moderation queue loads | Log in as admin → navigate to moderation | Pending reports/posts are displayed | High |
| TC-MOD-002 | Approve post from moderation UI | Select post → Approve | Post status updates; student notified | High |
| TC-MOD-003 | Reject post from moderation UI | Select post → Reject | Post removed from wall; student notified | High |
| TC-MOD-004 | Bulk moderate from UI | Select multiple posts → Bulk action | All selected posts moderated | Medium |
| TC-MOD-005 | Grouped reports view | Switch to grouped reports tab | Each card shows post + report count | Medium |

---

### 6.14 Audit Logs

**Reference:** `backend/app/api/routes/audit_logs.py`, `frontend/src/pages/AuditLogs.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-AUDIT-001 | Audit log created for login | Student logs in | Auth event recorded | High |
| TC-AUDIT-002 | Audit log for PHQ-9 submission | Student submits PHQ-9 | `assessment_submission` event recorded | High |
| TC-AUDIT-003 | Audit log for journal creation | Student creates journal | `journal_created` event recorded | Medium |
| TC-AUDIT-004 | Audit log for journal deletion | Student deletes journal | `journal_deleted` event recorded | Medium |
| TC-AUDIT-005 | Audit log for privacy change | Student updates privacy settings | `privacy_setting_changed` event recorded | Medium |
| TC-AUDIT-006 | Audit log for mantra moderation | Admin moderates a post | `mantra_wall_moderation` event recorded | Medium |
| TC-AUDIT-007 | Admin views audit log list | Admin → `GET /api/v1/admin/audit-logs` | Returns list of audit events | High |
| TC-AUDIT-008 | Audit log does not contain journal content | Review audit log entries | Journal text content is NOT stored in audit log | Critical |
| TC-AUDIT-009 | Student cannot access audit logs | Student JWT → audit log endpoint | `403 Forbidden` | High |
| TC-AUDIT-010 | Admin UI: audit log table | Log in as admin → Audit Logs page | Logs displayed with event type, actor, timestamp | Medium |

---

### 6.15 Rate Limiting

**Reference:** `backend/app/middleware/rate_limit.py`, `backend/app/api/routes/auth.py`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-RATE-001 | `/auth/me` rate limit | Send 31 requests/minute from same IP | 31st request returns `429 Too Many Requests` | Medium |
| TC-RATE-002 | Rate limit resets after window | Wait for window to reset → send request | Request succeeds | Low |
| TC-RATE-003 | Rate limiting is per IP | Different IPs send requests | Limits are tracked independently per IP | Low |

---

### 6.16 Student Dashboard & Companion Pet

**Reference:** `frontend/src/pages/StudentDashboard.tsx`, `frontend/src/constants/pets.ts`, `frontend/src/utils/petState.ts`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-DASH-001 | Dashboard loads after login | Log in as student | Dashboard renders with wellness summary and quick actions | High |
| TC-DASH-002 | Activity streak displayed | Complete activities → check dashboard | Streak count is correct and updating | Medium |
| TC-DASH-003 | Companion pet renders | Log in as student | Companion pet image shown in idle state | Medium |
| TC-DASH-004 | Pet state changes with activity | Complete assessment → check pet | Pet animation moves to happy state | Low |
| TC-DASH-005 | Pet nickname displayed | Set nickname in profile | Nickname shown above companion | Low |
| TC-DASH-006 | Product tour (first login) | Log in for first time | Product tour walkthrough is shown | Medium |
| TC-DASH-007 | Dark mode toggle | Click theme toggle | UI switches between light and dark themes | Medium |
| TC-DASH-008 | Dark mode persists on refresh | Toggle dark mode → refresh | Dark mode setting retained | Low |

---

### 6.17 Profile Management

**Reference:** `backend/app/api/routes/profile.py`, `frontend/src/pages/Profile.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-PROFILE-001 | View profile | Student → `GET /api/v1/auth/me` | Returns year_level, program, section, companion_pet, companion_nickname | High |
| TC-PROFILE-002 | Update profile details | Update year level / program / section | Profile updated and reflected on next fetch | High |
| TC-PROFILE-003 | Update companion pet | Select different pet | companion_pet field updated | Medium |
| TC-PROFILE-004 | Update companion nickname | Enter nickname | companion_nickname field updated | Medium |
| TC-PROFILE-005 | Pet nickname persists on refresh | Set nickname → refresh | Nickname still displayed | Low |

---

### 6.18 Onboarding Flow

**Reference:** `frontend/src/pages/Onboarding.tsx`

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TC-ONBOARD-001 | Onboarding shown after account creation | Create new account | Onboarding flow starts automatically | High |
| TC-ONBOARD-002 | Onboarding collects year level / program / section | Complete onboarding steps | Profile fields saved correctly | High |
| TC-ONBOARD-003 | Companion pet selection | Select a companion pet during onboarding | Pet saved to profile | Medium |
| TC-ONBOARD-004 | Skip/complete onboarding → redirected to dashboard | Finish onboarding | Lands on Student Dashboard | High |
| TC-ONBOARD-005 | Onboarding not repeated | Log out → log in again | Onboarding is not shown again | Medium |

---

## 7. Non-Functional Testing

### 7.1 Security Testing

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| TC-SEC-001 | JWT token tampering | Modify payload claims → access admin endpoint | `401 Unauthorized` | Critical |
| TC-SEC-002 | Expired JWT | Use expired token | `401 Unauthorized` | Critical |
| TC-SEC-003 | IDOR — journal entries | Student B accesses Student A's journal ID via API | `404 Not Found` | Critical |
| TC-SEC-004 | IDOR — assessment results | Student B accesses Student A's PHQ-9 result ID | `404 Not Found` | Critical |
| TC-SEC-005 | IDOR — notifications | Student B reads Student A's notification | `404 Not Found` or `403 Forbidden` | Critical |
| TC-SEC-006 | XSS in Mantra Wall post | Submit post with `<script>alert(1)</script>` | Script not executed; content sanitized or rejected | High |
| TC-SEC-007 | SQL injection in query params | Inject SQL in filter query params | No SQL error; input safely handled | High |
| TC-SEC-008 | Backend-only privacy enforcement | Disable frontend privacy toggle via DevTools → call API | Backend enforces the setting regardless | High |
| TC-SEC-009 | Audit log content — no sensitive data | Review audit log entries | Journal content and wellness scores are NOT in audit logs | Critical |
| TC-SEC-010 | Analytics contain no individual IDs | Review all admin analytics responses | No `user_id`, name, or individual score in any response | Critical |

### 7.2 Performance Testing

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| TC-PERF-001 | Dashboard load time | Load student dashboard | Renders within 3 seconds on standard connection | Medium |
| TC-PERF-002 | Journal list with 50+ entries | List journals with large dataset | Response within 2 seconds | Medium |
| TC-PERF-003 | PHQ-9 submission response time | Submit PHQ-9 | Response within 1 second | Medium |
| TC-PERF-004 | Analytics endpoint under load | Concurrent admin analytics requests | No server crash; acceptable response time | Low |

### 7.3 Accessibility Testing

Verify against **WCAG 2.1 Level AA** guidelines:

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| TC-A11Y-001 | Keyboard navigation — login form | Navigate using Tab/Enter only | All fields and buttons reachable | High |
| TC-A11Y-002 | Keyboard navigation — assessment | Complete PHQ-9 using keyboard only | All questions answerable | High |
| TC-A11Y-003 | Color contrast — light mode | Check text/background contrast | Minimum 4.5:1 ratio | Medium |
| TC-A11Y-004 | Color contrast — dark mode | Check text/background contrast | Minimum 4.5:1 ratio | Medium |
| TC-A11Y-005 | Screen reader: form labels | Use screen reader on all forms | All inputs have accessible labels | Medium |
| TC-A11Y-006 | Focus indicator visible | Tab through all interactive elements | Focus ring visible at all times | Medium |
| TC-A11Y-007 | Error messages announced | Submit invalid form | Error is read by screen reader | High |

### 7.4 Responsiveness Testing

| Test ID | Viewport | Pages to Test | Expected Result | Priority |
|---------|---------|---------------|-----------------|----------|
| TC-RESP-001 | 375px (mobile) | Dashboard, Journal, Assessments | No horizontal overflow; layout adapts | High |
| TC-RESP-002 | 768px (tablet) | Dashboard, MantraWall, Resources | Two-column layout appropriate | Medium |
| TC-RESP-003 | 1366px (laptop) | All major pages | Sidebar navigation functional | Medium |
| TC-RESP-004 | 1920px (desktop) | All major pages | Content centered and proportional | Low |

---

## 8. Regression Testing

The following areas must be regression-tested when any related module is modified:

| Area | Trigger |
|------|---------|
| Authentication | Any change to `auth.py`, `supabase_auth.py`, or JWT handling |
| RBAC | Any change to `rbac.py` or route decorators |
| Consent gate | Any change to `consent_gate.py` or consent schema |
| Assessment scoring | Any change to `phq9_service.py` or `gad7_service.py` |
| Mantra Wall | Any change to content filter, moderation, or notification logic |
| Analytics privacy | Any change to `admin_analytics_service.py` |
| Privacy settings | Any change to `privacy_repository.py` or related routes |

---

## 9. Entry & Exit Criteria

### Entry Criteria (QA begins when…)
- [ ] All backend unit tests in `backend/tests/` pass with no errors
- [ ] Backend server starts without errors (`uvicorn app.main:app`)
- [ ] Frontend builds without errors (`pnpm run build`)
- [ ] Frontend dev server runs without errors (`pnpm run dev`)
- [ ] Test Supabase project is configured and seeded
- [ ] At least one student account and one admin account available in test environment
- [ ] API documentation accessible at `/docs`

### Exit Criteria (QA sign-off when…)
- [ ] All **Critical** and **High** priority test cases pass
- [ ] Zero open **Critical** defects
- [ ] Zero open **High** defects that block core user journeys
- [ ] All RBAC and consent gate tests pass (backend-verified)
- [ ] All IDOR tests pass (no unauthorized cross-user data access)
- [ ] No individual student data exposed in analytics responses
- [ ] Audit log does not store journal content or PHQ-9/GAD-7 scores
- [ ] Existing Pytest suite passes (100% of previously passing tests)

---

## 10. Test Deliverables

| Deliverable | Description |
|-------------|-------------|
| **Test Plan** (this document) | Scope, strategy, and test cases |
| **Test Execution Report** | Per-test-case pass/fail status with evidence |
| **Defect Log** | Bug reports with severity, steps to reproduce, and screenshots |
| **Pytest Run Report** | HTML or terminal output of full test suite run |
| **Security Test Summary** | RBAC/IDOR/XSS findings and status |
| **Accessibility Report** | WCAG 2.1 AA findings |
| **Final QA Sign-off Sheet** | Sign-off confirming exit criteria met |

---

## 11. Defect Classification

| Severity | Definition | Example |
|----------|-----------|---------|
| **Critical** | Blocks a core user journey or exposes a security vulnerability | Student can access another student's journal; admin analytics expose individual data |
| **High** | Significantly impacts functionality but a workaround exists | PHQ-9 accepts invalid responses; consent gate not enforced |
| **Medium** | Moderate impact; user experience degraded | Notification not sent after moderation; audit log entry missing |
| **Low** | Minor cosmetic or UX issue | Pet animation doesn't update; tooltip misspelled |

---

## 12. Test Schedule

| Phase | Activity | Duration |
|-------|---------|---------|
| **Phase 1** | Environment setup and test data seeding | Day 1 |
| **Phase 2** | Backend unit tests (run existing Pytest suite) | Day 1–2 |
| **Phase 3** | API testing — Auth, RBAC, Consent (Modules 6.1–6.3) | Day 2–3 |
| **Phase 4** | API testing — Assessments, Journals, Check-ins (6.4–6.7) | Day 3–4 |
| **Phase 5** | API testing — Mantra Wall, Notifications, Privacy (6.8–6.10) | Day 4–5 |
| **Phase 6** | API testing — Admin features (6.11–6.14) | Day 5–6 |
| **Phase 7** | End-to-end UI testing — Student role | Day 6–7 |
| **Phase 8** | End-to-end UI testing — Admin role | Day 7–8 |
| **Phase 9** | Security testing (IDOR, JWT, XSS, SQL injection) | Day 8–9 |
| **Phase 10** | Non-functional testing (performance, accessibility, responsiveness) | Day 9–10 |
| **Phase 11** | Defect retesting and regression | Day 10–11 |
| **Phase 12** | Final sign-off and delivery | Day 12 |

---

> [!NOTE]
> This test plan is based on the codebase state as of **November 9, 2026**. Any feature additions or refactors after handover must be accompanied by updated test cases before QA proceeds on those changes.

> [!CAUTION]
> MindCare handles sensitive student wellness data. Testers must not use real student data under any circumstances. All test accounts and data must be synthetic and limited to the designated test environment.

