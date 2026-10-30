# Current System State: MindCare (MindTrack Campus)

**As of:** September 17, 2026  
**Institution:** Polytechnic University of the Philippines (PUP) – Santa Maria Campus  
**Current Phase:** Phase 23 (Student & Admin Flow Hardening & Contract Lock) Complete → Ready for Phase 24 (Deployment Preparation)  
**Overall Health:** 🟢 Fully Functional Local Runtime (Backend 126/126 tests passing, Frontend 0 lint errors, 0 build errors)

---

## 1. Executive Summary

**MindCare** is a mental health and wellness monitoring platform engineered specifically for students and student affairs staff at PUP Santa Maria Campus. The system is designed as an **early-warning and supportive self-monitoring platform**, explicitly decoupled from psychiatric diagnosis or automated clinical decision-making.

The project is structured as a full-stack monorepo featuring a **Python / FastAPI** backend and a modern **React 19 / Vite / Tailwind CSS 4** frontend, backed by **PostgreSQL on Supabase** with field-level encryption for personal notes and versioned consent enforcement under the Philippine Data Privacy Act (RA 10173).

---

## 2. Clinical & Architectural Guardrails (ADR Index)

All development strictly adheres to the ten architectural decision records (ADRs) defined in [`docs/DECISIONS.md`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/docs/DECISIONS.md) and codified in [`.agents/rules/`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/.agents/rules/):

| ADR | Domain | Architectural & Clinical Mandate | Current Enforcement |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Stack Architecture | Decoupled FastAPI backend and React frontend monorepo. | Fully segregated (`backend` vs `frontend/frontend`). |
| **ADR-002** | RBAC Roles | Strict 2-tier role model: `'student'` and `'admin'`. No legacy prototype roles (`oss_admin`, `counselor`). | Enforced in DB check constraints, JWT verification, and React route guards. |
| **ADR-003** | Privacy & Consent | Versioned informed consent before wellness tracking (RA 10173). | Mandated on onboarding step 3, enforced at API route dependencies. |
| **ADR-004** | Data Encryption | Fernet symmetric field-level encryption for journal entries (`MultiFernet` rotation). | All journal reflections encrypted at rest in PostgreSQL. |
| **ADR-005** | NLP Sentiment | Transient in-memory VADER analysis; raw journal text is never logged to telemetry. | Sentiment scores recorded; raw text omitted from logs and telemetry. |
| **ADR-006** | Score Suppression | Raw numeric assessment integers (`total_score`) must NEVER be exposed to students. | Assessments present qualitative bands only (`Minimal`, `Mild`, `Moderate`, `Severe`). |
| **ADR-007** | Positive Mantra Wall | Anonymous peer-encouragement wall; not an unmoderated forum or venting board. | Automated sentiment filtering + pre-moderation queue. |
| **ADR-008** | Pre-Moderation | Posts require administrative approval before public broadcast. | `AdminModeration.tsx` tabs (`Pending`, `Approved`, `Rejected`). |
| **ADR-009** | Clinical Scope | No automated counselor scheduling or simulated booking. | Direct crisis dialers (`tel:1553`, `tel:09178998727`) and campus guidance office directory. |
| **ADR-010** | Operational Honesty | Zero deceptive client-side mock mutations for unsupported backend endpoints. | `AdminUserManagement.tsx` documents real Supabase Auth console infrastructure. |

---

## 3. Architecture & Monorepo Structure

```text
mindtrack-campus/
├── .agents/
│   └── rules/
│       ├── clinical-boundaries.md    # Score suppression, non-diagnostic qualitative terms, hotlines
│       ├── security-and-data.md      # Fernet encryption, RA 10173 consent, transient NLP, zero credentials in logs
│       └── stack-conventions.md      # venv execution paths, frontend/frontend root, RBAC constraints
├── backend/
│   ├── app/
│   │   ├── api/routes/               # 14 route modules (auth, assessments, journals, wellness, moderation, etc.)
│   │   ├── core/                     # config, security, encryption, database session
│   │   ├── middleware/               # SlowAPI rate limiting, error handlers, CORS
│   │   ├── models/                   # SQLAlchemy ORM models (users, assessments, journals, mantra, audit_logs)
│   │   ├── schemas/                  # Pydantic v2 schemas with qualitative response envelopes
│   │   └── services/                 # NLP service, wellness calculation, repository layer
│   ├── alembic/                      # Database migrations (Revisions 1 through 6)
│   ├── tests/                        # 21 test suites (126 passing automated pytest tests)
│   └── venv/                         # Designated Python 3.14 virtual environment
├── frontend/
│   └── frontend/                     # Designated Vite / React application root
│       ├── src/
│       │   ├── components/           # Layout, DesktopNav, SidebarLink, WellnessPriorityCard, MantraWallPost, TermsModal
│       │   ├── contexts/             # AuthContext, AuthContextValue, useAuth
│       │   ├── pages/                # 14 application pages (Student + Admin flows)
│       │   ├── routes/               # ProtectedRoute (Role-aware RBAC route guard)
│       │   ├── services/             # api.ts (Centralized Axios client with interceptors)
│       │   └── types/                # TypeScript models mirroring backend schemas
│       ├── package.json              # React 19, Lucide React, Tailwind CSS 4, Vite 8
│       └── vite.config.ts            # Vite bundler configuration
└── docs/
    ├── CURRENT_PROGRESS.md           # Progress chronicle
    ├── CURRENT_SYSTEM_STATE.md       # Comprehensive system state artifact (this file)
    ├── DECISIONS.md                  # Formal Architecture Decision Records (ADR-001 to ADR-010)
    ├── FRONTEND_INTEGRATION_AUDIT.md # Initial frontend integration gap analysis
    └── FRONTEND_INTEGRATION_RESPONSE.md # Remediation response & contract lock
```

---

## 4. Current State of Application Flows

### A. Student-Facing Flow (`/`)
1. **Authentication (`/login`, `/create-account`):**
   - Supabase Auth with secure JWT exchange.
   - Dynamic onboarding detection: redirects to `/onboarding` if initial consent/profile is incomplete.
2. **Interactive Onboarding (`/onboarding`):**
   - 5-step wizard: Welcome → Campus Context → Informed Consent signing (with disabled state & loading spinner) → Initial Mood check-in → Readiness.
3. **Student Dashboard (`/dashboard`):**
   - Quick Mood Logger (1–5) with instant confirmation badge and check-in count increment.
   - Dynamic [`WellnessPriorityCard`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/components/WellnessPriorityCard.tsx): Supports lowercase priority levels (`low`, `moderate`, `elevated`) and a neutral `Getting Started` state for `insufficient_data`.
   - Quick action shortcuts (Check-In, Journal, Screening, Mantra Wall).
4. **Daily Mood Check-In (`/check-in`):**
   - High-contrast mood selector with ring highlight, disabled button state during API write, and immediate redirect confirmation.
5. **Mental Health Assessments (`/assessments`):**
   - PHQ-9 (Depression screening) & GAD-7 (Anxiety screening).
   - Strict score suppression (ADR-006): Displays qualitative bands only (`Minimal`, `Mild`, `Moderate`, `Severe`).
   - Crisis Question 9 Escalation: Highlighting immediate hotlines if self-harm risk is indicated.
   - Question loading skeletons and submission button locking to prevent duplicate writes.
6. **Encrypted Journaling (`/journal`):**
   - Field-level Fernet symmetric encryption before database storage.
   - In-memory VADER sentiment detection (positive, neutral, negative feedback).
   - Post-save reflection prompt with direct link to [`/support`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/pages/ProfessionalSupport.tsx).
   - Animated skeleton cards for loading historical reflections.
7. **Mantra Wall (`/mantra-wall`):**
   - Peer-encouragement wall (ADR-007).
   - Post submission undergoes automated sentiment filtering and routes into the pre-moderation queue.
8. **Campus Resources (`/resources`):**
   - Searchable, category-filtered directory of campus and national mental health resources.
9. **Professional Support (`/support`):**
   - Contextualized for PUP Santa Maria Campus Guidance & Counseling Office.
   - Click-to-call mobile links for the National Mental Health Crisis Hotline (`tel:1553`) and Hopeline (`tel:09178998727`).
10. **Privacy Settings (`/privacy-settings`):**
    - RA 10173 consent toggles, data export request, and account anonymization/deletion requests.
    - Toggle skeletons prevent layout flashing on initial fetch.
11. **Profile (`/profile`):**
    - User account details, verified active consent status, and navigation to notifications, support, and resources.
12. **Notifications (`/notifications`):**
    - Real-time notification list with unread state tracking and read-all actions.

---

### B. Admin & Operational Flow (`/admin`)
1. **Role-Based Protection:**
   - Guaranteed via [`ProtectedRoute.tsx`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/routes/ProtectedRoute.tsx) checking `user.role === 'admin'`. Unauthorized student attempts are redirected to `/dashboard`.
2. **Navigation & Responsive Layout (`Layout.tsx`):**
   - Collapsible desktop sidebar and dedicated mobile drawer with burger toggle for all 5 administrative sections.
   - Dedicated mobile logout button for administrators.
3. **Admin Dashboard (`/admin`):**
   - Operational KPIs: Total Active Students, Pending Moderation Count, High Priority Triage Drafts, System Health.
   - Skeletons on loading, clear retry controls on network failure.
   - Quick shortcut cards linking to Moderation, Resource Management, and Audit Logs.
4. **Mantra Wall Moderation (`/admin/moderation`):**
   - Segmented filter tabs: `All`, `Pending Review`, `Approved`, `Rejected` with dynamic badge counters.
   - Approve / Reject action buttons with optimistic state updates.
   - Empty state illustrations and manual refresh control.
5. **Resource Directory Management (`/admin/resources`):**
   - Full CRUD form with `Title`, `Category`, `URL`, and `Status` (`Active` vs `Draft / Inactive`).
   - Inline edit mode with explicit `Cancel` action.
   - Table skeleton loading states and responsive horizontal scrolling.
6. **System Audit Logs (`/admin/audit-logs`):**
   - Paginated security log viewer.
   - Search filter by user ID and dropdown filter by event category (`AUTH_LOGIN`, `JOURNAL_CREATE`, `MODERATION_ACTION`, etc.).
   - Visual status badges (`SUCCESS` vs `FAILURE`).
7. **User Management Notice (`/admin/users`):**
   - Aligned with ADR-010: Removed misleading client-side mock mutations (fake suspensions, `oss_admin` role assignment).
   - Provides clear, truthful operational guidance for managing student accounts and MFA via the Supabase Auth administrative console.

---

## 5. Test & Validation Summary

### Backend Automated Test Suite
- **Environment:** `backend\venv\Scripts\pytest`
- **Total Test Files:** 21 files across unit, integration, and security tests.
- **Pass Rate:** **126 passed**, 3 deselected, 0 failures (execution time ~4.3s).
- **Key Suites Verified:**
  - `tests/test_audit_logs.py`: Validates log creation, pagination, and PII masking.
  - `tests/test_auth.py` & `tests/test_rbac.py`: Validates Supabase JWT validation, role checks, and student/admin boundaries.
  - `tests/test_consent.py` & `tests/test_privacy.py`: Validates versioned consent, toggle state, and data deletion.
  - `tests/test_gad7.py` & `tests/test_phq9.py`: Validates 0–3 scoring, tier calculations, and Question 9 flag triggers.
  - `tests/test_journals.py`: Validates Fernet encryption roundtrip and NLP sentiment tagging.
  - `tests/test_mantra_wall.py`: Validates pre-moderation flow and sentiment screening.
  - `tests/test_qualitative_feedback.py`: Validates strict score suppression (ADR-006).
  - `tests/test_security.py`: Cross-cutting security, SQL injection defense, and CORS validation.

### Frontend Quality & Production Build
- **Environment:** `mindtrack-campus/frontend/frontend`
- **Linter:** `npm run lint` → **0 errors, 0 warnings**.
  - Fully compliant with React 19 and ESLint 10 `react-hooks/set-state-in-effect` constraints.
- **Compiler & Bundler:** `npm run build` (`tsc -b && vite build`) → **PASS**.
  - Clean client bundle generated in `dist/`.

---

## 6. Live Runtime Services (Current Background Tasks)

Both backend and frontend development servers are actively running in the development environment:

| Service | Address | Runtime Engine | Health Status | Background Task |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Uvicorn + FastAPI (via `backend/venv`) | 🟢 Healthy (`GET /health` → `{"status": "ok"}`) | `task-383` (Daemon) |
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | Vite v8.2.2 + React 19 | 🟢 Ready / Hot-Reload Active | `task-385` (Daemon) |

---

## 7. Codified Workspace Rules (`.agents/rules/`)

The repository includes explicit agent and developer instructions under `.agents/rules/` to prevent architectural drift:

1. **[`clinical-boundaries.md`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/.agents/rules/clinical-boundaries.md):**
   - Prohibits clinical diagnostic labeling.
   - Enforces qualitative band mapping (`Minimal`, `Mild`, `Moderate`, `Severe`).
   - Mandates strict score suppression in all student interfaces.
   - Dictates non-booking crisis intervention routing.
2. **[`security-and-data.md`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/.agents/rules/security-and-data.md):**
   - Enforces Fernet symmetric encryption for journal entries.
   - Enforces transient in-memory NLP (no persistent raw text logging).
   - Enforces RA 10173 data subject rights (consent, export, deletion).
   - Prohibits fake client-side mock mutations (ADR-010).
3. **[`stack-conventions.md`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/.agents/rules/stack-conventions.md):**
   - Specifies execution root: `mindtrack-campus/frontend/frontend` for npm.
   - Specifies execution root: `mindtrack-campus/backend` using `venv\Scripts\python`.
   - Restricts user roles strictly to `'student' | 'admin'`.

---

## 8. Next Development Roadmap (Phase 24 — Deployment Preparation)

With Phase 23 (Student & Admin Flow Hardening & Contract Lock) completed, the next workstream is **Phase 24**:

1. **Environment Audit (`.env` vs `.env.example`):**
   - Verify production environment variable definitions for backend (`DATABASE_URL`, `SUPABASE_JWT_SECRET`, `FERNET_KEY`, `CORS_ORIGINS`).
   - Verify frontend environment variable definitions (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`).
2. **Production CORS Lockdown:**
   - In `backend/app/main.py`, configure `CORS_ORIGINS` to accept production frontend domains (e.g. Vercel deployment URLs) while strictly forbidding wildcard `*`.
3. **Adviser & Clinical Sign-Off:**
   - Confirm with university thesis advisers / registered guidance counselors whether Mantra Wall pre-moderation (ADR-008) and the qualitative score suppression tiers (ADR-006) satisfy campus clinical protocol prior to User Acceptance Testing (UAT).
