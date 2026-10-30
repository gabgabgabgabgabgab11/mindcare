# Frontend Integration Response

**Date:** 2026-09-14  
**Scope:** Phase 23A frontend integration  
**Decision:** Finish student flows before beginning Phase 23E admin wiring.

## 1. Lint Resolution

The original command was run from the repository root by mistake and returned `ENOENT` because the package is under `frontend/frontend`. The corrected command was:

```text
Push-Location mindtrack-campus/frontend/frontend
npm run lint
Pop-Location
```

The initial frontend lint run reported 22 errors. The main output categories were:

```text
Layout.tsx
  react-refresh/only-export-components
  react-hooks/static-components

AuthContext.tsx
  react-refresh/only-export-components

Login.tsx
  @typescript-eslint/no-unused-vars: 'err' is defined but never used

StudentDashboard.tsx
  react-hooks/set-state-in-effect
```

The fixes were applied in this order:

- Changed `catch (err)` to bare `catch` in `Login.tsx`.
- Split `useAuth` into `contexts/useAuth.ts`.
- Split the React context value into `contexts/AuthContextValue.ts` so `AuthContext.tsx` exports the provider cleanly.
- Moved `SidebarLink` and `DesktopNavLink` out of `Layout.tsx` into stable component modules.
- Changed the dashboard greeting from effect-driven state to a derived value during render.
- Removed the stale `Link` import from `Layout.tsx`.

The focused validation sequence was:

```text
Initial lint: 22 errors
After first repair: 2 errors
After context split: 1 error
Final lint: PASS, 0 errors, 0 warnings
```

The lint command now completes successfully.

## 2. Student Flow Reality Check

The assessment question endpoints were checked against the backend routes. `GET /api/v1/assessments/phq9` and `GET /api/v1/assessments/gad7` have no authentication or consent dependency and are intentionally public so a student can inspect an instrument before deciding to take it. The Axios interceptor is compatible with this: it checks for a session token and skips the `Authorization` header when no session exists. Assessment submission remains consent-gated.

During this integration check, duplicate POST declarations in the assessment route modules were also corrected. The later duplicate GAD-7 implementation called the PHQ-9 scorer and stored the assessment as `phq9`. FastAPI's route order showed that the correct GAD-7 handler was registered first in the affected source, so the evidence does **not** support claiming that every real GAD-7 submission was mis-scored. The duplicate was still a serious correctness hazard because a route-order change could have activated the wrong implementation; it has been removed, leaving one correct submission route per instrument.

The backend virtual environment was activated and the full test suite was rerun. The strengthened GAD-7 regression now asserts that both persisted rows use `assessment_code == "gad7"`.

```text
Focused PHQ-9/GAD-7 tests: 24 passed
Full backend suite: 126 passed, 3 deselected
```

An aggregate check of the configured database found no response-shape mismatch:

```text
gad7: 1 row with 7 responses
phq9: 3 rows with 9 responses
```

No historical row currently appears to be a GAD-7 submission mislabeled as `phq9`. This check used counts and response lengths only; it did not expose student identifiers or response content.

The phrase “connected or prepared” needs to be separated into three states:

| Student flow | Real API call exists | Loading state | Error state | Empty state | Current classification |
|---|---:|---:|---:|---:|---|
| Authentication and profile bootstrap | Yes | Partial | Partial | N/A | Connected foundation |
| Onboarding consent | Yes | No dedicated indicator | Yes | N/A | API-connected, UX incomplete |
| Onboarding mood check-in | Yes | No dedicated indicator | Yes | N/A | API-connected, UX incomplete |
| Daily check-in | Yes | Yes | Yes | N/A | Connected |
| Dashboard mood check-in | Yes | Yes | Yes | N/A | Connected |
| Dashboard profile/journal/check-in summary | Yes | Partial | Yes | Partial | Connected, needs stronger states |
| PHQ-9 submission | Yes | Yes | Yes | N/A | Connected |
| GAD-7 submission | Yes | Yes | Yes | N/A | Connected |
| Assessment question loading | Yes | Yes | Yes | N/A | Connected |
| Journal list | Yes | Yes | Yes | Yes | Connected |
| Journal creation | Yes | Yes | Yes | N/A | Connected |
| Journal analysis | Yes | Covered by save modal | Degrades to no analysis | N/A | Connected, failure-isolated |
| Privacy settings load/save | Yes | Save indicator only | Yes | N/A | Connected, but contract is partial |
| Mantra Wall list | Yes | Yes | Yes | Yes | Connected |
| Mantra Wall creation | Yes | Submit indicator | Yes | N/A | Connected |
| Mantra Wall reporting | Yes | Yes | Yes | N/A | Connected |
| Resources | Yes | Yes | Yes | Yes | Connected through the student Resources API |
| Notifications | Yes | Yes | Yes | Yes | Connected through the student Notifications API |
| Wellness Priority | Yes | Yes | Yes | N/A | Connected with clinical disclosure |

### Specific findings

- `studentApi.ts` contains real service functions for check-ins, consent, PHQ-9, GAD-7, journals, privacy, and Mantra Wall.
- `Assessments.tsx` now loads question text, instructions, and response-scale labels from the public PHQ-9/GAD-7 question endpoints. Final submission has an explicit `Submitting...` state and remains consent-gated by the backend.
- `Journal.tsx` has real list/create/analysis calls plus loading, error, and explicit empty-list states.
- `MantraWall.tsx` has real list/create/report calls plus loading, error, empty, per-post reporting, and report-success states.
- `PrivacySettings.tsx` now contains only the two backend-supported privacy flags. The unsupported `counselorAccess` control was removed rather than relabeled, because the project does not have a counselor role or backend contract for it.
- `Onboarding.tsx` and `DailyCheckIn.tsx` call the real backend, but onboarding does not disable or label the mood choices while saving.
- `StudentDashboard.tsx` loads real identity, journal, and check-in data and saves the quick mood check-in. Its snapshot now distinguishes loading and unavailable data from a genuine zero count.
- `WellnessPriorityCard.tsx` loads the authenticated `GET /api/v1/wellness/priority` response and renders `clinical_validation_status` in a separate disclosure block before the qualitative priority and contributing factors. It does not display numeric scores.
- Resources, notifications, and consent status are now consumed by the student frontend. Consent status is displayed on Profile; Resources uses the active listing/search contract; Notifications uses the per-user list/read contract.

## 3. Student-First Sequence

The student implementation sequence was completed before Phase 23E. The remaining runtime verification work is:

1. Perform a real authenticated browser pass against the running backend for onboarding, check-in, assessment, journal, privacy, Mantra Wall, and Wellness Priority workflows.
2. Run `npm run lint`, `npm run build`, and endpoint-level verification after each small group of page changes.
3. Complete the authenticated browser walkthrough when a shared student session is available, then prepare Phase 24 deployment work.

Phase 23E was implemented after the 23C student contracts were connected. Admin user management remains deferred because no backend contract exists.

## 4. Blocking Decisions and Limitations

### Mantra Wall pre-moderation

Pre-moderation is implemented, but ADR-008 remains **PROPOSED**. Adviser or psychologist-validator confirmation is required before UAT. This should be resolved rather than carried indefinitely as a background note.

### Admin user management

Admin user management remains blocked because no backend user-management endpoint or scope exists. The frontend should not imply that this workflow is available until that contract is defined.

### Clinical-adjacent validation

Wellness Prioritization and the related thresholds remain explicitly draft and pending expert validation. Frontend integration must preserve that status and must not present the output as a diagnosis or validated clinical judgment.

## 5. Current Checkpoint

- `npm run lint`: PASS
- `npm run build`: PASS after the lint edits; Vite reports only the existing main-chunk size warning
- Local runtime smoke check: PASS; Vite served the login page at `http://127.0.0.1:5173/`
- Authenticated dashboard check: pending a shared logged-in student browser session; no credentials were requested or handled in chat
- Focused backend tests: PASS (`24 passed`)
- Full backend suite: PASS (`126 passed, 3 deselected`); eight existing dependency/deprecation warnings remain
- Admin wiring: intentionally deferred
- Student API integration: partial but real, with Wellness Priority and its clinical disclosure complete
- Next focused implementation: authenticated browser verification; Phase 23C then covers consent status, Resources, and Notifications