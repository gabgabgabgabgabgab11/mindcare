# MindCare - Frontend Integration Notes

Running changelog for the Phase 23 frontend/backend integration.
One entry per change, newest sections appended at the bottom.

## Phase 23A - Contract Lock & Conflict Resolution

### Freedom Wall -> Mantra Wall consolidation
The open Freedom Wall is out (ADR-007, psychologist review). The Mantra Wall is
the single real page. `src/pages/MantraWall.tsx` replaces both
`src/pages/FreedomWall.tsx` and `src/pages/SmallWins.tsx`;
`src/components/MantraWallPost.tsx` replaces `src/components/FreedomWallPost.tsx`.
Post types are the backend's `affirmation | gratitude | win`. The hug counter is
gone - the backend has no such concept. Optional anonymity is an optional
nickname only.

### Role string
`oss_admin` -> `admin` in `AuthContext.tsx`, `ProtectedRoute.tsx`, and `App.tsx`.
The backend `rbac.py` checks `profile.role` against `"student"` / `"admin"`.

### Mood scale
Single mapping in `src/constants/mood.ts`: 1 Very Low, 2 Low, 3 Neutral,
4 Good, 5 Very Good. `Onboarding.tsx` and `DailyCheckIn.tsx` both read from it.
Storage is the integer; display is faces and words, never digits.

### Types
`src/types/index.ts` mirrors the backend Pydantic schemas in
`backend/app/schemas/*.py` - one interface per response shape.

### Blocked
`AdminUserManagement.tsx` is blocked. No backend endpoint exists for user
management. Its route is commented out in `App.tsx` until a backend phase
scopes it.

