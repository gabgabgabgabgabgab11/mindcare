# Stack Conventions & Development Workflows

Rules and conventions for building and testing across the MindCare monorepo.

## 1. Directory Structure & Execution Context
- **Frontend Commands:** ALL frontend npm commands (`npm run build`, `npm run lint`, `npm test`, `npm install`) MUST be executed from the nested directory:
  `mindtrack-campus/frontend/frontend`
  *Never run frontend commands from the root `mindtrack-campus` or intermediate `frontend` directory.*
- **Backend Commands:** ALL Python / FastAPI / Alembic commands must be executed from:
  `mindtrack-campus/backend`
  Always use the project's designated virtual environment: `venv\Scripts\pytest` or `venv\Scripts\python` (Windows) / `venv/bin/...` (Unix), or activate it with `venv\Scripts\Activate.ps1`.

## 2. Role-Based Access Control (RBAC) (ADR-002)
- Allowed user roles in the database and JWT tokens are strictly:
  `'student' | 'admin'`
- Legacy prototype roles like `'oss_admin'` or `'counselor'` are prohibited unless explicitly introduced through an Alembic migration and approved ADR.
- Route guards:
  - Students route to `/dashboard`
  - Admins route to `/admin`
  - Admins attempting to access student-specific pages (e.g. daily check-ins, journal) are redirected to `/admin`

## 3. Frontend Architecture Standards
- **Framework:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Lucide React.
- **State Flow:**
  - Authentication state handled via [`AuthContext`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/contexts/AuthContext.tsx) backed by Supabase Auth and `/api/auth/me`.
  - Service abstraction: API calls should be centralized in [`src/services/api.ts`](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/services/api.ts) with typed error handling and credentials inclusion.
- **React 19 & ESLint 10 Hook Rules:**
  - Avoid calling `setIsLoading(true)` synchronously inside `useEffect()` without dependencies, as this triggers `react-hooks/set-state-in-effect` linting errors.
  - Initialize loading state with `useState(true)` for initial fetch, and toggle `false` in `.finally()`.
- **UI Aesthetics & Responsiveness:**
  - Design aesthetic: Premium teal/emerald palette with subtle glassmorphism and clear micro-interactions.
  - Always provide loading skeletons, disabled button states during API mutation, and user feedback on completion.
  - Mobile responsiveness: Ensure desktop sidebar navigation collapses cleanly to a mobile burger drawer on viewports < 768px.
