# Admin Surface — Total Revision Implementation Plan

Rebuild the MindCare admin surface into a professional, analytics-driven operations console with five sections: Overview, Moderation, Resources, Audit Logs, and System Information. This replaces the current admin pages (Dashboard, Moderation, Resources, Audit Logs, User Management) while respecting all hard constraints (no numeric scores, only student/admin roles, no editable thresholds, no fabricated data, no individual surveillance, privacy-aware aggregates, no email escalation, no data export).

---

## User Review Required

> [!IMPORTANT]
> **Backend analytics endpoints are required for the Overview dashboard charts.** Three new backend endpoints are specified (overview KPIs, audit timeline, moderation timeline). The wellness-aggregate endpoint (item 4) requires a privacy decision and the `section` field migration — I plan to build the frontend with an "unavailable" empty state for wellness aggregates so the admin surface can ship independently.

> [!IMPORTANT]
> **The existing `AdminUserManagement.tsx` at `/admin/users` will be removed** and replaced by the System Information page at `/admin/system`. The content about Supabase Auth management will be preserved in the new page, but the route and component change.

> [!WARNING]
> **No charting library is currently installed.** I will use `recharts` (lightweight, React-native, no 3D/gradient defaults) for the Overview charts. This adds one new dependency.

---

## Open Questions

> [!IMPORTANT]
> **Recharts vs. hand-rolled SVG:** The Overview page needs line charts and bar charts. I plan to install `recharts` (~40KB gzipped) for this. If you'd prefer a different library or hand-rolled SVG, let me know. Recharts is well-suited for flat, single-tone chart fills per the visual direction.

---

## Proposed Changes

The work is split into two main phases: **Backend** (new analytics endpoints + section column) and **Frontend** (complete admin surface rebuild). Changes are ordered by dependency.

---

### Phase 1: Backend — Analytics Endpoints & Section Column

#### [NEW] [section_catalog.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/core/section_catalog.py)
- Version-controlled Python constant `SECTION_CATALOG` with BSIT and BSCS sections
- `get_valid_sections(program, year_level)` helper
- `is_valid_combination(program, year_level, section)` validator

#### [NEW] Alembic migration — `add_section_to_profiles.py`
- Adds `section` column (nullable String) to `profiles` table

#### [MODIFY] [profile.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/models/profile.py)
- Add `section = Column(String, nullable=True)` to `Profile` model

#### [MODIFY] [auth.py schema](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/schemas/auth.py)
- Add `section: str | None` to `MeResponse`

#### [NEW] [profile.py route](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/api/routes/profile.py)
- `GET /api/v1/profile/section-options?program=X&year_level=Y` — returns valid sections from catalog
- `PUT /api/v1/profile` — self-service profile update validated against catalog

#### [NEW] [admin_analytics.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/api/routes/admin_analytics.py)
Three read-only, `require_admin` endpoints, each emitting an `admin_action` audit log:

1. **`GET /api/v1/admin/analytics/overview`** — Returns KPI counts in one call:
   - `pending_moderation_count` — count of posts with `moderation_status='pending'`
   - `approved_posts_count` — count of posts with `moderation_status='approved'`
   - `active_resources_count` — count of resources with `is_active=True`
   - `audit_events_7d_count` — audit log count for last 7 days
   - `unresolved_reports_count` — count of reports whose associated post is still `pending` or `flagged`
   - `mantra_post_type_distribution` — `{affirmation: N, gratitude: N, win: N}` from all approved posts

2. **`GET /api/v1/admin/analytics/audit-timeline?days=30`** — Returns:
   - `timeline: [{date: "2026-09-01", count: N, by_type: {admin_action: N, ...}}, ...]`

3. **`GET /api/v1/admin/analytics/moderation-timeline?days=30`** — Returns:
   - `timeline: [{date: "2026-09-01", pending: N, approved: N, rejected: N}, ...]`

#### [NEW] [admin_analytics_service.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/services/admin_analytics_service.py)
- Pure database query functions for each analytics endpoint
- All queries use SQLAlchemy `func.count`, `func.date_trunc`, group by

#### [MODIFY] [main.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/main.py)
- Register new `admin_analytics_router` and `profile_router`

#### [NEW] [test_admin_analytics.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/tests/test_admin_analytics.py)
- Unit tests for overview KPIs, timeline aggregation, and admin-only access

#### [NEW] [test_profile.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/tests/test_profile.py)
- Tests for section catalog validation and profile update

---

### Phase 2: Frontend — Complete Admin Surface Rebuild

#### 2A. Dependencies & Shared Infrastructure

##### Install recharts
```
npm install recharts
```

##### [MODIFY] [types/index.ts](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/types/index.ts)
- Add types for all new analytics API responses (`OverviewKPIs`, `AuditTimelineEntry`, `ModerationTimelineEntry`, etc.)
- Remove duplicate type declarations (there are currently duplicated `Resource`, `AuditLog`, `Notification`, and `AdminMantraWallReportItem` types)

##### [MODIFY] [services/adminApi.ts](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/services/adminApi.ts)
- Add API functions for the three new analytics endpoints
- Add `listAllMantraPosts()` function for moderation (currently only reports are fetched, but moderation needs all posts)
- Keep all existing working functions

---

#### 2B. Admin Layout — Sidebar Navigation

##### [MODIFY] [Layout.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/components/Layout.tsx)
- **Replace all emoji characters** with lucide-react icons (🌿 → `<Leaf />` icon)
- **Admin desktop navigation**: Switch from top-bar `DesktopNavLink` items to a **persistent left sidebar** on desktop (collapsible), while keeping the existing mobile drawer pattern
- Sidebar sections: Overview, Moderation, Resources, Audit Logs, System Information
- Replace `Users` nav link with `System` (route `/admin/system`)
- Logout control visible at both breakpoints (already present)
- Use lucide-react icons for all nav items: `LayoutDashboard`, `Shield`, `BookOpen`, `ScrollText`, `Settings`
- Admin layout: sidebar + main content area with full width

---

#### 2C. Page Rebuilds (5 Pages)

##### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/AdminDashboard.tsx) → Overview (`/admin`)
Complete rewrite as the analytics-driven overview:

**KPI Tiles** (top row, fetched from `/api/v1/admin/analytics/overview`):
- Pending moderation count (amber accent)
- Total approved posts
- Active resources
- Audit events (last 7 days)
- Unresolved reports
- Each with lucide-react icon, large number, compact label

**Charts Section** (2×2 grid on desktop):
1. Audit event volume over time (line chart, 30 days) — from audit-timeline endpoint
2. Audit events by type (horizontal bar chart)
3. Mantra Wall post-type distribution (simple bar: affirmation/gratitude/win)
4. Moderation throughput: pending vs approved vs rejected over time (stacked area)

**Recent Activity Feed** (bottom section, 2-column):
- Last 10 audit events (from existing `listAuditLogs` with limit)
- Last 5 moderation actions (from existing `listModerationReports`)
- Each shows actor, action, relative timestamp

**Chart styling**: Flat fills, muted indigo/slate palette, labeled axes, no gradients, accessible empty states.

**Empty/loading states**: Skeleton tiles, skeleton chart areas, proper error retry.

##### [MODIFY] [AdminModeration.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/AdminModeration.tsx) → Moderation (`/admin/moderation`)
Upgrade presentation, keep existing core functionality:

- **Segmented tabs**: All / Pending / Approved / Rejected / Flagged — each with live count badge
- Each post card: post type (lucide icon), content, nickname (or "Anonymous"), timestamp, report count if any, expandable report reasons
- Approve / Reject with optimistic update + rollback on failure (already implemented)
- **Replace ✓ emoji** with lucide `Check` icon
- Empty state per tab: lucide icon + plain-language line
- Remove purple color scheme, use indigo per visual direction

##### [MODIFY] [AdminResourceManagement.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/AdminResourceManagement.tsx) → Resources (`/admin/resources`)
Upgrade to table-first layout with filters:

- **KPI strip** (top): total, active, inactive, count by category
- **Filters**: category dropdown, status dropdown, text search on title
- **Table**: title, category, URL, status (Active/Inactive), last updated
- **Inline create/edit**: side panel or modal (not separate page)
- Inactive resources: muted row treatment, reactivate action
- **Replace 🔗 emoji** with lucide `ExternalLink` icon
- **Replace ✓ emoji** with lucide `Check` icon

##### [MODIFY] [AuditLogs.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/AuditLogs.tsx) → Audit Logs (`/admin/audit-logs`)
Upgrade filtering and readability:

- **Filters**: event type (populated from real `EVENT_TYPES` constant — `login`, `failed_authentication`, `assessment_submission`, `journal_created`, `journal_deleted`, `privacy_setting_changed`, `admin_action`, `mantra_wall_moderation`), actor ID text input, date range (start/end date pickers)
- **Summary strip**: event counts by type for current filter window
- **Table**: timestamp, event type (subtle indigo/slate status chip), actor, description
- **Pagination**: real pagination using the `limit` + offset/cursor params against the backend
- Make read-only nature visually obvious: no action column, no row menus
- Replace purple chip color with indigo/slate

##### [NEW] [SystemInfo.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/SystemInfo.tsx) → System Information (`/admin/system`)
New read-only page replacing `AdminUserManagement`:

- **Consent version**: Current version (`CURRENT_CONSENT_VERSION` from backend), display read-only
- **Instruments in use**: PHQ-9 and GAD-7 with source citations, note that thresholds are instrument-defined and not configurable
- **Wellness Prioritization rule version**: fetched from `/api/v1/wellness/priority` context or hardcoded display of `wellness-priority-rules-draft-v1-pending-validation` with its `clinical_validation_status` rendered prominently
- **NLP model**: VADER Lexicon v1 — read-only display
- **Backend health**: fetches `/health` and `/health/db` and displays status
- **Supabase Auth panel**: Clearly worded, explains user account management is in Supabase console — preserves content from current `AdminUserManagement.tsx` — no non-functional buttons
- All content uses lucide-react icons, no emoji

##### [DELETE] [AdminUserManagement.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/AdminUserManagement.tsx)
- Replaced by `SystemInfo.tsx`

---

#### 2D. Route & Import Updates

##### [MODIFY] [App.tsx](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/App.tsx)
- Replace `AdminUserManagement` import with `SystemInfo`
- Change `/admin/users` route to `/admin/system` with `SystemInfo` component

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd backend && venv\Scripts\pytest

# Frontend
cd frontend\frontend && npm run lint && npm run build
```

### Manual Verification
- **Admin login**: Verify all 5 sections load with real data
- **Student login**: Confirm every `/admin/*` route still redirects to `/dashboard`
- **Charts**: Verify every chart traces to a real endpoint; no hardcoded arrays
- **Emoji audit**: `grep -rn "[\x{1F000}-\x{1FFFF}]" src/pages/Admin* src/pages/AuditLogs* src/pages/SystemInfo* src/components/Layout.tsx` — must return zero matches
- **Gradient audit**: `grep -rn "gradient\|bg-gradient" src/pages/Admin* src/pages/AuditLogs* src/pages/SystemInfo* src/components/Layout.tsx` — must return zero matches
- **Constraint validation**: Review all pages against the 8 hard constraints
