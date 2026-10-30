# MindCare System State

This file mirrors the detailed system architecture, clinical guardrails, flow completion status, and test validation results maintained in:

👉 **[docs/CURRENT_SYSTEM_STATE.md](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/docs/CURRENT_SYSTEM_STATE.md)**

---

## At-a-Glance Status

- **Institution:** Polytechnic University of the Philippines (PUP) – Santa Maria Campus
- **Active Phase:** Phase 23 Complete → Ready for Phase 24 (Deployment Preparation)
- **Backend Tests:** 126 / 126 passed (`backend\venv\Scripts\pytest`)
- **Frontend Linter:** 0 errors, 0 warnings (`frontend/frontend` → `npm run lint`)
- **Frontend Build:** PASS (`frontend/frontend` → `npm run build`)
- **Running Local Services:**
  - Backend API: [http://127.0.0.1:8000](http://127.0.0.1:8000) (`GET /health` → `ok`)
  - Frontend Web: [http://localhost:5173](http://localhost:5173)
- **Codified Guardrails:** [`.agents/rules/`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/.agents/rules/)
  - `clinical-boundaries.md` (ADR-006 score suppression, non-diagnostic qualitative terms, hotlines)
  - `security-and-data.md` (ADR-004 Fernet encryption, RA 10173 consent, ADR-010 honest representations)
  - `stack-conventions.md` (`backend/venv` and `frontend/frontend` execution paths)

Please consult [docs/CURRENT_SYSTEM_STATE.md](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/docs/CURRENT_SYSTEM_STATE.md) for the exhaustive breakdown.
