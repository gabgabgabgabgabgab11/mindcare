# Frontend Routing and Backend Integration Audit

**Date:** 2026-09-13  
**Scope:** `frontend/frontend/src` compared with `backend/app/api`  
**Validation:** `npm run build` from `frontend/frontend` (passes after the light routing patch)

## Light Patch Status

The initial routing findings in this report were addressed with a light frontend patch:

- `/small-wins` navigation now uses the existing `/check-in` page.
- Freedom Wall navigation now uses the registered `/mantra-wall` page.
- The existing `AdminUserManagement` page is registered at `/admin/users`.
- The layout now checks the backend role value `admin`.
- Onboarding now passes explicit PHQ-9 or GAD-7 state to the assessment page.
- The unused Mantra Wall state setter was removed so the build passes.

Backend integration remains intentionally out of scope for this patch. Feature pages still use local/mock behavior until API integration is added.

## Student Integration Status

The following student flows are now connected through the authenticated Axios client:

- Onboarding consent and initial mood check-in.
- Daily check-in and dashboard quick mood check-in.
- PHQ-9 and GAD-7 result submission.
- Journal list, creation, and optional sentiment analysis.
- Privacy settings load/update for the backend-supported anonymity and activity flags.
- Mantra Wall list, post creation, and reporting.
- Dashboard identity, journal streak, and mood check-in count.
- Profile identity, program/year, journal count, and check-in count.

Resources and notifications were previously pending and are now API-connected. MindCare does not include research booking, counselor booking, or appointment booking; the unsupported hugs metric remains pending.

## Executive Summary

The frontend is only partially integrated with the backend. The authentication bootstrap is connected through Supabase plus `GET /api/v1/auth/me`, but the feature pages do not currently call the backend. Most wellness, assessment, journal, privacy, wall, resource, notification, and admin screens use local state, mock data, alerts, or timers.

The most important routing problems are:

1. The navigation links to `/small-wins` and `/wall`, but neither path exists in the route table. The implemented wall page is `/mantra-wall`.
2. Admin role handling is inconsistent. The backend profile role is a free-form string and the UI checks `oss_admin`, while the frontend type and route guard only allow `admin`. This currently causes TypeScript errors and can block real admin users.
3. Onboarding sends both PHQ-9 and GAD-7 choices to `/assessments` without route state, and `/assessments` defaults to PHQ-9. The GAD-7 button therefore opens the wrong questionnaire.
4. Several visible buttons have no action or only show a prototype alert instead of navigating, opening a real resource, or calling an API.

## Severity Flags

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| R-01 | Critical | Admin route guard/type contract does not match the role used by the UI/backend data (`oss_admin` vs `admin`). Admin users may be redirected to the student dashboard, and the build fails on the comparison. | [types/index.ts](../frontend/frontend/src/types/index.ts), [ProtectedRoute.tsx](../frontend/frontend/src/routes/ProtectedRoute.tsx), [Layout.tsx](../frontend/frontend/src/components/Layout.tsx), [auth.py](../backend/app/api/routes/auth.py) |
| R-02 | High | `/small-wins` is rendered in desktop and mobile navigation but is not declared in `App.tsx`. Clicking it falls through to `/login`. | [Layout.tsx](../frontend/frontend/src/components/Layout.tsx), [App.tsx](../frontend/frontend/src/App.tsx) |
| R-03 | High | `/wall` is rendered in navigation but is not declared. The actual page is registered at `/mantra-wall`, so the navigation link is broken. | [Layout.tsx](../frontend/frontend/src/components/Layout.tsx), [App.tsx](../frontend/frontend/src/App.tsx) |
| R-04 | High | Admin dashboard navigates to `/admin/users`, but that route is not declared. The imported `AdminUserManagement` page is unreachable through routing. | [AdminDashboard.tsx](../frontend/frontend/src/pages/AdminDashboard.tsx), [AdminUserManagement.tsx](../frontend/frontend/src/pages/AdminUserManagement.tsx), [App.tsx](../frontend/frontend/src/App.tsx) |
| R-05 | High | Onboarding's GAD-7 button uses the same route as PHQ-9 without `state: { type: 'GAD-7' }`; the assessment page defaults to PHQ-9. | [Onboarding.tsx](../frontend/frontend/src/pages/Onboarding.tsx), [Assessments.tsx](../frontend/frontend/src/pages/Assessments.tsx) |
| I-01 | High | Only `AuthContext` makes an application API call. The feature pages do not use the configured Axios client. | [AuthContext.tsx](../frontend/frontend/src/contexts/AuthContext.tsx), [axios.ts](../frontend/frontend/src/config/axios.ts) |
| I-02 | High | Daily check-in and onboarding mood selection explicitly simulate success and do not call `POST /api/v1/wellness/checkins`. | [DailyCheckIn.tsx](../frontend/frontend/src/pages/DailyCheckIn.tsx), [Onboarding.tsx](../frontend/frontend/src/pages/Onboarding.tsx), [wellness_checkins.py](../backend/app/api/routes/wellness_checkins.py) |
| I-03 | High | Assessments display local questionnaires/results but do not load questions or submit responses to the PHQ-9/GAD-7 endpoints. Results are not persisted. | [Assessments.tsx](../frontend/frontend/src/pages/Assessments.tsx), [assessments.py](../backend/app/api/routes/assessments.py), [gad7.py](../backend/app/api/routes/gad7.py) |
| I-04 | High | Journal entries and NLP insights are mock/local only; no journal list, create, or analysis endpoint is called. | [Journal.tsx](../frontend/frontend/src/pages/Journal.tsx), [journals.py](../backend/app/api/routes/journals.py) |
| I-05 | High | Privacy toggles are local state and saving is a timer. They do not load or update `/api/v1/privacy/settings`. | [PrivacySettings.tsx](../frontend/frontend/src/pages/PrivacySettings.tsx), [privacy.py](../backend/app/api/routes/privacy.py) |
| I-06 | High | Mantra Wall loading, post creation, and reporting are placeholders. The page does not call its matching wall endpoints. | [MantraWall.tsx](../frontend/frontend/src/pages/MantraWall.tsx), [mantra_wall.py](../backend/app/api/routes/mantra_wall.py) |
| I-07 | Medium | Resources were previously hard-coded and used prototype actions. The student page is now API-connected; no booking flow is part of the MindCare scope. | [Resources.tsx](../frontend/frontend/src/pages/Resources.tsx), [resources.py](../backend/app/api/routes/resources.py) |
| I-08 | Medium | Admin moderation, resource management, user management, and dashboard data use mock state/timers. They are not connected to the available admin endpoints. | [AdminModeration.tsx](../frontend/frontend/src/pages/AdminModeration.tsx), [AdminResourceManagement.tsx](../frontend/frontend/src/pages/AdminResourceManagement.tsx), [AdminUserManagement.tsx](../frontend/frontend/src/pages/AdminUserManagement.tsx), [AdminDashboard.tsx](../frontend/frontend/src/pages/AdminDashboard.tsx) |
| C-01 | Medium | The authenticated browser walkthrough is still pending; the frontend now consumes the available consent status, notifications, Wellness Priority, and audit-log APIs. | [consent.py](../backend/app/api/routes/consent.py), [notifications.py](../backend/app/api/routes/notifications.py), [wellness.py](../backend/app/api/routes/wellness.py), [audit_logs.py](../backend/app/api/routes/audit_logs.py) |
| B-01 | Medium | `npm run build` fails with the admin role comparison errors and an unused `setPosts` state setter in Mantra Wall. | [Layout.tsx](../frontend/frontend/src/components/Layout.tsx), [MantraWall.tsx](../frontend/frontend/src/pages/MantraWall.tsx) |

## Route Table Check

### Declared frontend routes

| Path | Page | Guard | Result |
| --- | --- | --- | --- |
| `/login` | Login | Public | Declared |
| `/welcome` | Onboarding | Student | Declared |
| `/check-in` | DailyCheckIn | Student | Declared, but save is simulated |
| `/dashboard` | StudentDashboard | Student | Declared, but mood save is simulated |
| `/assessments` | Assessments | Student | Declared, but assessment API is unused |
| `/journal` | Journal | Student | Declared, but journal API is unused |
| `/privacy` | PrivacySettings | Student | Declared, but not used by the main profile link |
| `/mantra-wall` | MantraWall | Student | Declared |
| `/resources` | Resources | Student | Declared, mock data |
| `/support` | ProfessionalSupport | Student | Declared |
| `/profile` | Profile | Student | Declared |
| `/profile/privacy` | PrivacySettings | Student | Declared |
| `/admin` | AdminDashboard | Admin guard | Declared, role contract currently inconsistent |
| `/admin/moderation` | AdminModeration | Admin guard | Declared, mock data |
| `/admin/resources` | AdminResourceManagement | Admin guard | Declared, mock data |
| `/admin/users` | AdminUserManagement | Admin guard | **Missing** |

### Navigation/click destinations

| Source action | Intended destination | Check |
| --- | --- | --- |
| Desktop/mobile `Small Wins` link | `/small-wins` | **Broken: no route** |
| Desktop/mobile `Freedom Wall` link | `/wall` | **Broken: route is `/mantra-wall`** |
| Dashboard PHQ-9 card | `/assessments` with `PHQ-9` state | Correct destination |
| Dashboard GAD-7 card | `/assessments` with `GAD-7` state | Correct destination |
| Onboarding PHQ-9 choice | `/assessments` | Reaches page but loses explicit type; currently defaults correctly by accident |
| Onboarding GAD-7 choice | `/assessments` | **Wrong questionnaire: no GAD-7 state** |
| Profile Privacy & Security | `/profile/privacy` | Correct destination |
| Privacy back button | `/profile` | Correct destination |
| Admin Review Queue | `/admin/moderation` | Correct destination |
| Admin Add Resource | `/admin/resources` | Correct destination |
| Admin Manage Users | `/admin/users` | **Broken: no route** |
| Assessment Back | `navigate(-1)` | Works when browser history has a prior page; otherwise has no explicit fallback |
| Login success | `/admin` for admins, `/welcome` for students | Correct after the light patch; students now enter onboarding first |
| Profile Notifications | None | **Inert button** |
| Profile Help & Support | None | **Inert button** |
| Profile Crisis Resources `View` | None | **Inert button** |
| Resources Quick Relief `Start Breathing` | None | **Inert button** |
| Resources non-OSS cards | `alert()` only | **No real navigation/external URL** |
| Admin Export Report | None | **Inert button** |
| Admin `View All` and alert `Review` buttons | None | **Inert buttons** |
| Journal `Talk to a Counselor` | None | **Inert button** |

## Backend Endpoint Coverage

| Backend capability | Endpoint(s) available | Frontend status |
| --- | --- | --- |
| Auth/profile | `GET /api/v1/auth/me` | **Connected** from `AuthContext` |
| Wellness check-ins | `POST/GET /api/v1/wellness/checkins` | **Not connected** |
| Wellness priority | `GET /api/v1/wellness/priority` | **Not connected** |
| PHQ-9 | `GET/POST /api/v1/assessments/phq9`, history, result | **Not connected** |
| GAD-7 | `GET/POST /api/v1/assessments/gad7`, history, result | **Not connected** |
| Journals and analysis | `GET/POST/PUT/DELETE /api/v1/journals` | **Not connected** |
| Privacy | `GET/PUT /api/v1/privacy/settings` | **Not connected** |
| Consent | `GET /api/v1/consent/status`, `POST /api/v1/consent`, withdraw | **Not connected** |
| Mantra Wall | list/create/report under `/api/v1/mantra-wall` | **Not connected** |
| Resources | `GET /api/v1/resources` | **Connected** |
| Admin resources | CRUD under `/api/v1/admin/resources` | **Connected** |
| Admin moderation | reports/moderation under `/api/v1/admin/mantra-wall` | **Connected** |
| Notifications | list/read under `/api/v1/notifications` | **Connected** |
| Audit logs | `GET /api/v1/admin/audit-logs` | **Connected** |

## Build Result

Command:

```text
npm run build
```

Result: **failed** with three TypeScript errors:

- `Layout.tsx`: comparing `Role | null` with `"oss_admin"` has no overlap, reported twice.
- `MantraWall.tsx`: `setPosts` is declared but never read.

The frontend should not be considered fully integrated or release-ready until the role contract, missing routes, API calls, and inert buttons are resolved and the production build passes.

## Recommended Fix Order

1. Establish one canonical role value across backend schema, frontend `Role`, `ProtectedRoute`, login redirect, and `Layout` (`oss_admin` is the value currently used in UI mock data).
2. Fix route destinations: map `/wall` to `/mantra-wall`, either implement `/small-wins` or remove that navigation item, and register `/admin/users`.
3. Pass assessment state from onboarding, especially `{ type: 'GAD-7' }`.
4. Add a small API service layer using the configured Axios client, beginning with check-ins, assessments, journals, privacy, and mantra wall.
5. Replace mock/timer success paths with loading, error, and response-driven states.
6. Connect the remaining admin/resource/notification/consent flows and give every visible action a real destination or explicit disabled state.
7. Add route smoke tests and API contract tests, then require `npm run build` to pass in CI.