# 🧠 MindTrack Campus — Complete Setup Guide

> **Created:** September 2026  
> **Purpose:** Device migration & GitHub clone → working development environment  
> **Stack:** FastAPI (Python 3.14) + React/Vite (TypeScript) + Supabase + PostgreSQL

---

## 📑 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Option A — Migrating from ZIP](#option-a--migrating-from-zip-same-project)
3. [Option B — Cloning from GitHub](#option-b--cloning-from-github-fresh-clone)
4. [Backend Setup (FastAPI)](#backend-setup-fastapi)
5. [Frontend Setup (React/Vite)](#frontend-setup-reactvite)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Running the App](#running-the-app)
8. [Verifying Everything Works](#verifying-everything-works)
9. [Common Errors & Fixes](#common-errors--fixes)

---

## 1. Prerequisites

Install these on your **new device** before anything else:

| Tool | Version Used | Download Link |
|------|-------------|---------------|
| **Python** | 3.14+ | https://www.python.org/downloads/ |
| **Node.js** | 20+ | https://nodejs.org/ |
| **npm** | 11+ | (bundled with Node.js) |
| **Git** | Latest | https://git-scm.com/downloads |

### Verify installations

Open **PowerShell** and run:

```powershell
python --version    # Should show Python 3.14.x
node --version      # Should show v20.x.x
npm --version       # Should show 11.x.x
git --version       # Should show git version 2.x.x
```

> **Windows Users:** During Python install, check **"Add Python to PATH"**. During Git install, choose **"Git Bash"** or use PowerShell.

---

## Option A — Migrating from ZIP (Same Project)

Use this if you zipped the entire `Capstone-Project` folder from your old device.

### Step 1 — Extract the ZIP

Extract the zip to a location of your choice. Recommended:

```
C:\Users\<YourName>\OneDrive\Capstone-Project\
```

### Step 2 — Verify the Folder Structure

After extraction, confirm you have this structure:

```
Capstone-Project/
├── .git/                          ← Git history (keep this!)
├── .gitignore
└── mindtrack-campus/
    ├── backend/
    │   ├── .env                   ← CRITICAL — keep this file!
    │   ├── .env.example
    │   ├── requirements.txt
    │   ├── alembic.ini
    │   ├── alembic/
    │   ├── app/
    │   └── tests/
    └── frontend/
        └── frontend/
            ├── .env               ← CRITICAL — keep this file!
            ├── package.json
            ├── src/
            └── ...
```

> **Important:** The `.env` files from your ZIP carry your real credentials. **Do NOT lose them.**  
> The `node_modules/` and `.venv/` folders are large — Git ignores them. You will reinstall them below.

### Step 3 — Continue to Backend Setup and Frontend Setup below.

---

## Option B — Cloning from GitHub (Fresh Clone)

Use this if the project is pushed to GitHub and you are starting fresh.

### Step 1 — Clone the Repository

```powershell
# Navigate to where you want the project
cd C:\Users\<YourName>\OneDrive

# Clone (replace with your actual repo URL)
git clone https://github.com/<your-username>/Capstone-Project.git

# Enter the project
cd Capstone-Project\mindtrack-campus
```

> Do not know the repo URL? Go to your GitHub repo → click the green **Code** button → copy the HTTPS URL.

### Step 2 — Restore Your `.env` Files (CRITICAL)

After cloning, the `.env` files **will NOT exist** (they are gitignored for security).  
You must recreate them manually.

#### Backend `.env`

Create the file at `backend/.env`:

```powershell
# In PowerShell, from the mindtrack-campus folder:
New-Item -Path "backend\.env" -ItemType File
notepad backend\.env
```

Paste in the following (fill in your actual Supabase credentials):

```env
DATABASE_URL=postgresql+psycopg2://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
ENVIRONMENT=development
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_JWT_SECRET=<YOUR_JWT_SECRET>
CORS_ORIGINS=http://localhost:5173
JOURNAL_ENCRYPTION_KEY=<YOUR_FERNET_KEY>

# Optional: test database (if you run tests)
TEST_DATABASE_URL=postgresql://<TEST_DB_CONNECTION_STRING>
TEST_SUPABASE_ANON_KEY=<TEST_ANON_KEY>
```

**Where to find these values:**
- Go to [supabase.com](https://supabase.com) → your project → **Project Settings**
- `DATABASE_URL` → Settings → Database → **Connection string** (use the psycopg2 URI format)
- `SUPABASE_URL` → Settings → API → **Project URL**
- `SUPABASE_ANON_KEY` → Settings → API → **anon / public** key
- `SUPABASE_JWT_SECRET` → Settings → API → **JWT Secret**
- `JOURNAL_ENCRYPTION_KEY` → **NEVER regenerate if journal data exists!** Use your saved key.

**Generate a NEW Fernet Key** (only if you have NO existing journal data):

```powershell
cd backend
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

#### Frontend `.env`

Create the file at `frontend/frontend/.env`:

```powershell
New-Item -Path "frontend\frontend\.env" -ItemType File
notepad frontend\frontend\.env
```

Paste in:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

> These values match your Supabase project — same `SUPABASE_URL` and `SUPABASE_ANON_KEY` as backend.

### Step 3 — Continue to Backend Setup and Frontend Setup below.

---

## Backend Setup (FastAPI)

Run these commands from the **`mindtrack-campus/backend`** folder.

```powershell
cd C:\Users\<YourName>\OneDrive\Capstone-Project\mindtrack-campus\backend
```

### Step 1 — Create a Virtual Environment

```powershell
python -m venv .venv
```

### Step 2 — Activate the Virtual Environment

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

> If you get an execution policy error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Then retry the activate command.

You should now see `(.venv)` at the start of your terminal prompt.

### Step 3 — Install Dependencies

```powershell
pip install -r requirements.txt
```

This installs all packages: FastAPI, SQLAlchemy, Alembic, psycopg2, cryptography, uvicorn, and more.

### Step 4 — Run Database Migrations

This applies the schema to your Supabase PostgreSQL database:

```powershell
alembic upgrade head
```

> **Note:** This requires your `DATABASE_URL` in `.env` to be correctly set and Supabase to be reachable.

### Step 5 — Start the Backend Server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Backend running at: **http://localhost:8000**
- API docs (Swagger): **http://localhost:8000/docs**

---

## Frontend Setup (React/Vite)

Run these commands from the **`mindtrack-campus/frontend/frontend`** folder.

```powershell
cd C:\Users\<YourName>\OneDrive\Capstone-Project\mindtrack-campus\frontend\frontend
```

### Step 1 — Install Dependencies

```powershell
npm install
```

This installs React, Vite, Supabase JS, Tailwind CSS, Recharts, Lucide icons, etc.

### Step 2 — Start the Dev Server

```powershell
npm run dev
```

- Frontend running at: **http://localhost:5173**

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string (psycopg2) | Supabase → Settings → Database |
| `ENVIRONMENT` | `development` or `production` | Set manually |
| `SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Public anon key | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | JWT secret for token validation | Supabase → Settings → API |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` for dev |
| `JOURNAL_ENCRYPTION_KEY` | Fernet key for encrypting journal entries | **Your saved key — never regenerate!** |
| `TEST_DATABASE_URL` | Separate test DB connection | Optional — for running pytest |
| `TEST_SUPABASE_ANON_KEY` | Anon key for test Supabase project | Optional — for running pytest |

### Frontend (`frontend/frontend/.env`)

| Variable | Description | Value |
|----------|-------------|-------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase project URL | Same as backend `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | Same as backend `SUPABASE_ANON_KEY` |

---

## Running the App

You need **two terminals** open simultaneously:

### Terminal 1 — Backend

```powershell
cd Capstone-Project\mindtrack-campus\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend

```powershell
cd Capstone-Project\mindtrack-campus\frontend\frontend
npm run dev
```

Then open your browser → **http://localhost:5173**

---

## Verifying Everything Works

### Backend Health Check

Open your browser at **http://localhost:8000/docs**  
You should see the FastAPI interactive Swagger UI.

Or use PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
```

### Frontend Check

- Go to **http://localhost:5173**
- The login/signup page should load
- Try logging in — if Supabase credentials are correct, auth will work

### Database Check

```powershell
# In backend terminal with .venv active
alembic current
```

This shows the current migration revision. If it matches `head`, your DB schema is up to date.

---

## Common Errors & Fixes

### `ModuleNotFoundError` on backend start

```
Fix: Make sure your virtual environment is activated
     .\.venv\Scripts\Activate.ps1
     pip install -r requirements.txt
```

### PowerShell execution policy error

```
Fix: Run in PowerShell:
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### `ENOENT: no such file or directory, open '.env'` (frontend)

```
Fix: Create frontend/frontend/.env with the VITE_ variables listed in the reference table above
```

### Alembic `Can't locate revision identified by 'head'`

```
Fix: Make sure DATABASE_URL in backend/.env is correct and Supabase is online
     Then run: alembic upgrade head
```

### CORS error in browser console

```
Fix: Ensure CORS_ORIGINS in backend/.env includes http://localhost:5173
     Restart the backend after changing .env
```

### `npm install` fails with peer dependency errors

```
Fix: npm install --legacy-peer-deps
```

### Supabase auth not working after clone

```
Fix: Double-check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend .env
     They must match your active Supabase project exactly (no trailing slashes)
```

### psycopg2 install fails on new device

```
Fix: It should use psycopg2-binary (already in requirements.txt)
     If it still fails: pip install psycopg2-binary
```

---

## Project Structure Overview

```
Capstone-Project/
└── mindtrack-campus/
    ├── backend/                    # FastAPI Python backend
    │   ├── app/
    │   │   ├── api/                # Route handlers
    │   │   ├── core/               # Config, settings
    │   │   ├── db/                 # Database session
    │   │   ├── middleware/          # Auth, rate limiting
    │   │   ├── models/             # SQLAlchemy models
    │   │   ├── nlp/                # VADER sentiment analysis
    │   │   ├── schemas/            # Pydantic schemas
    │   │   ├── security/           # JWT/auth logic
    │   │   ├── services/           # Business logic
    │   │   ├── utils/              # Helpers
    │   │   └── main.py             # FastAPI app entry point
    │   ├── alembic/                # DB migration scripts
    │   ├── tests/                  # pytest test suite
    │   ├── .env                    # Secrets (gitignored)
    │   ├── .env.example            # Template for .env
    │   └── requirements.txt        # Python dependencies
    └── frontend/
        └── frontend/               # Vite + React + TypeScript
            ├── src/                # App source code
            ├── public/             # Static assets
            ├── .env                # Secrets (gitignored)
            ├── package.json        # Node dependencies
            ├── vite.config.ts      # Vite config
            └── tailwind.config.js  # Tailwind CSS config
```

---

## Security Reminders

- **Never commit `.env` files** — they are gitignored for a reason
- **Never regenerate `JOURNAL_ENCRYPTION_KEY`** if real user journal data exists — old entries become permanently unreadable
- **Never share `SUPABASE_JWT_SECRET`** — it is used to sign and validate all auth tokens
- **Store your `.env` values** somewhere safe (password manager, encrypted note) before migrating

---

*Last updated: September 2026 | MindTrack Campus Capstone Project*
