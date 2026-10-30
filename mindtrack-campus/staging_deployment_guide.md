# MindTrack Campus — Staging Deployment Guide

A step-by-step guide to give your groupmates a **live, shareable URL** they can use without touching your code. No changes to your codebase are required until explicitly noted — everything here is dashboard/CLI work on external services.

---

## Overview: Three Environments

| | **Local Dev** (now) | **Staging** (this guide) | **Production** (later) |
|---|---|---|---|
| Backend | `localhost:8000` via `uvicorn --reload` | Always-on URL on Render | Always-on URL |
| Frontend | `localhost:5173` via `npm run dev` | Shareable URL on Vercel | Shareable URL |
| Database | Your real Supabase (`htcgjpvl…`) | **New** Supabase project | Decide later |
| Purpose | You, actively coding | Groupmates clicking around | Real students |

---

## Step 1 — Create a Staging Supabase Project

> [!IMPORTANT]
> Do NOT reuse your dev Supabase project or your test Supabase project (from integration tests). Staging needs its own project to keep concerns clean.

### 1.1 Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Name it something like `mindtrack-staging`
4. Choose the **same region** as your dev project (to minimize latency)
5. Set a **database password** — save this somewhere safe (you'll need it for the connection string)
6. Wait for the project to finish provisioning (~2 minutes)

### 1.2 Grab the credentials

Once the project is ready, go to **Settings → API** in the Supabase dashboard. You need three values — write them down:

| What | Where to find it | Example |
|---|---|---|
| **Project URL** | `Settings → API → Project URL` | `https://abcdefghij.supabase.co` |
| **Anon public key** | `Settings → API → anon / public` | `eyJhbGciOi...` |
| **Database connection string** | `Settings → Database → Connection string → URI` | `postgresql://postgres.[ref]:[password]@...pooler.supabase.com:5432/postgres` |

> [!TIP]
> Use the **Session Mode** pooler connection string (port 5432) for your backend. This is what your existing [config.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/core/config.py) expects.

### 1.3 Run migrations against the staging database

Open a **new PowerShell terminal** (don't overwrite your dev `.env`). Set the staging database URL temporarily:

```powershell
# Navigate to the backend directory
cd c:\Users\EMMANUEL\OneDrive\Capstone-Project\mindtrack-campus\backend

# Temporarily point at the staging database
$env:DATABASE_URL = "postgresql+psycopg2://postgres.[STAGING_REF]:[STAGING_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Also need these so pydantic Settings doesn't complain about missing required fields:
$env:SUPABASE_URL = "https://[STAGING_REF].supabase.co"
$env:SUPABASE_ANON_KEY = "[STAGING_ANON_KEY]"
$env:JOURNAL_ENCRYPTION_KEY = "[GENERATE_A_NEW_FERNET_KEY_FOR_STAGING]"

# Run all migrations
alembic upgrade head
```

> [!WARNING]
> **Generate a NEW `JOURNAL_ENCRYPTION_KEY`** for staging — don't copy your dev key. Journals encrypted with one key can't be read with another, so keeping them separate means staging test data stays isolated.
>
> Generate one with:
> ```powershell
> python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
> ```

### 1.4 Create test accounts

In the **staging** Supabase dashboard:

1. Go to **Authentication → Users**
2. Click **"Add User" → "Create New User"**
3. Create at least:
   - **Student account**: `teststudent@mindtrack.test` / a simple password
   - **Admin account**: `testadmin@mindtrack.test` / a simple password
4. After creating them, you'll need to manually set the admin's role. Go to **Table Editor → profiles** and update the `role` column for the admin user to `admin` (or however your app assigns admin roles).

> [!NOTE]
> These are the credentials you'll hand to your groupmates. They never need your personal account.

---

## Step 2 — Deploy the Backend on Render

### 2.1 Prerequisites

- Your code is on GitHub (it already is)
- You have a [Render account](https://render.com) (free tier is fine)

### 2.2 Create the service

1. Log into Render → **"New" → "Web Service"**
2. Connect your GitHub repo: `mindtrack-campus`
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `mindcare-staging` (or any name you want) |
| **Region** | Choose one close to your Supabase region |
| **Root Directory** | `backend` |
| **Runtime** | Python |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 2.3 Set environment variables

In Render's **Environment** tab, add these variables (all pointing at your **staging** Supabase project):

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://postgres.[STAGING_REF]:[PASSWORD]@...pooler.supabase.com:5432/postgres` |
| `SUPABASE_URL` | `https://[STAGING_REF].supabase.co` |
| `SUPABASE_ANON_KEY` | `[staging project's anon key]` |
| `JOURNAL_ENCRYPTION_KEY` | `[the new Fernet key you generated in Step 1.3]` |
| `ENVIRONMENT` | `staging` |
| `CORS_ORIGINS` | `http://localhost:5173` *(update this after Step 3 with the Vercel URL)* |
| `CURRENT_CONSENT_VERSION` | `1.0` |

> [!IMPORTANT]
> Leave `CORS_ORIGINS` as `http://localhost:5173` for now. You'll come back and add the Vercel URL after Step 3.

### 2.4 Deploy

Click **"Create Web Service"**. Render will:
1. Clone your repo
2. Run `pip install -r requirements.txt` in the `backend/` directory
3. Start uvicorn

You'll get a URL like: **`https://mindcare-staging.onrender.com`**

### 2.5 Verify

Open your browser and hit:
```
https://mindcare-staging.onrender.com/health
```
You should see your health check response. If you see an error, check Render's **Logs** tab.

> [!NOTE]
> **Free tier cold starts**: Render's free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30–60 seconds. This is fine for groupmate testing. Warn them: "first load is slow, just wait."

---

## Step 3 — Deploy the Frontend on Vercel

### 3.1 Prerequisites

- [Vercel account](https://vercel.com) (free, sign in with GitHub)

### 3.2 Import the project

1. Log into Vercel → **"Add New" → "Project"**
2. Import your `mindtrack-campus` GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend/frontend` |
| **Build Command** | `npm run build` (or leave default) |
| **Output Directory** | `dist` |

### 3.3 Set environment variables

In Vercel's **Environment Variables** section (during import or in Settings after):

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://mindcare-staging.onrender.com` *(your Render URL from Step 2.4)* |
| `VITE_SUPABASE_URL` | `https://[STAGING_REF].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `[staging project's anon key]` |

> [!WARNING]
> **`VITE_` prefix is mandatory.** Vite only exposes env vars prefixed with `VITE_` to the client bundle. Your code in [supabaseClient.ts](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/config/supabaseClient.ts) and [axios.ts](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/src/config/axios.ts) already uses these correctly.

### 3.4 Deploy

Click **"Deploy"**. Vercel will:
1. Run `npm install` then `npm run build` (`tsc -b && vite build` per your [package.json](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/frontend/frontend/package.json))
2. Serve the `dist/` output as static files

You'll get a URL like: **`https://mindtrack-staging.vercel.app`**

### 3.5 SPA routing fix

> [!IMPORTANT]
> Your app uses React Router. Without this, refreshing any page other than `/` will show a Vercel 404.

Create a file `frontend/frontend/vercel.json` with:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This tells Vercel to route all paths to `index.html` so React Router can handle them client-side. **This is the one file change needed** — I have not made it, ask me to if you'd like.

---

## Step 4 — CORS: The One Thing That Will Break Everything If Skipped

Now that you have your Vercel URL, go back to **Render's dashboard**:

1. Go to your `mindcare-staging` service → **Environment**
2. Update `CORS_ORIGINS` to:

```
http://localhost:5173,https://mindtrack-staging.vercel.app
```

(Replace `mindtrack-staging.vercel.app` with your actual Vercel URL)

3. **Save** — Render will automatically redeploy with the new value.

### Why this matters

Your [main.py](file:///c:/Users/EMMANUEL/OneDrive/Capstone-Project/mindtrack-campus/backend/app/main.py#L46-L52) reads `CORS_ORIGINS` via `settings.cors_origins_list` and passes it to the CORS middleware. Without the Vercel domain in that list, **every single API call from the deployed frontend will fail** with a CORS error — the browser blocks it silently, and all your groupmates will see is a blank screen or missing data.

### How to debug CORS if something looks wrong

1. Open browser DevTools → **Console** tab
2. Look for red errors containing `CORS` or `Access-Control-Allow-Origin`
3. If you see them: the `CORS_ORIGINS` value on Render doesn't include the exact origin the browser is sending from
4. Common mistakes:
   - Trailing slash: `https://mindtrack-staging.vercel.app/` ← **wrong** (no trailing slash)
   - `http` vs `https`: Vercel serves over `https`, make sure you wrote `https://`
   - Typo in the domain name

---

## Step 5 — Hand It to Your Groupmates

### What to give them

| What | Value |
|---|---|
| **URL** | `https://mindtrack-staging.vercel.app` (your Vercel URL) |
| **Student login** | `teststudent@mindtrack.test` / `[password]` |
| **Admin login** | `testadmin@mindtrack.test` / `[password]` |

### What NOT to give them

- ❌ Your `.env` files
- ❌ Your codebase / repo access (unless they're contributing code)
- ❌ Your personal Supabase dashboard credentials
- ❌ Any API keys or connection strings

### Message template

> Hey! Here's the staging link for MindTrack Campus:
>
> 🔗 **https://mindtrack-staging.vercel.app**
>
> **Student account:** teststudent@mindtrack.test / [password]
> **Admin account:** testadmin@mindtrack.test / [password]
>
> ⚠️ First load might take 30-60 seconds (free server waking up) — just wait.
>
> Try breaking things and let me know what doesn't work!

---

## Step 6 — Ongoing: How Updates Get to Staging

Once both Render and Vercel are connected to your GitHub repo:

| Action | What happens |
|---|---|
| You push to `main` | Both Render and Vercel auto-redeploy |
| You push to a branch | Vercel creates a **preview deployment** (unique URL per branch/PR). Render only deploys from the branch you configured. |
| New migration added | You must **manually** run `alembic upgrade head` against the staging database (repeat Step 1.3's approach) |

> [!CAUTION]
> **Migrations are NOT automatic on Render's free tier.** If you add a new Alembic migration, the staging database won't update itself. You need to manually run `alembic upgrade head` pointed at the staging `DATABASE_URL`. A common pattern is to add a Render build step, but for a capstone project, doing it manually is fine.

---

## Quick Reference: All Staging Credentials in One Place

Keep a private note (NOT in your repo) with these values:

```
=== STAGING SUPABASE ===
Project URL:     https://[STAGING_REF].supabase.co
Anon Key:        [key]
Database URL:    postgresql+psycopg2://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres
Fernet Key:      [staging fernet key]

=== STAGING BACKEND (Render) ===
Service URL:     https://mindcare-staging.onrender.com
Dashboard:       https://dashboard.render.com/...

=== STAGING FRONTEND (Vercel) ===
Site URL:        https://mindtrack-staging.vercel.app
Dashboard:       https://vercel.com/...

=== TEST ACCOUNTS ===
Student:         teststudent@mindtrack.test / [password]
Admin:           testadmin@mindtrack.test / [password]
```

---

## Troubleshooting Cheat Sheet

| Symptom | Likely cause | Fix |
|---|---|---|
| Frontend loads but API calls fail silently | CORS misconfigured | Check `CORS_ORIGINS` on Render matches your Vercel URL exactly |
| "Missing VITE_SUPABASE_URL…" error in console | Env vars not set on Vercel | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard, redeploy |
| Login works but data is empty | Migrations not run on staging DB | Run `alembic upgrade head` against staging `DATABASE_URL` |
| 404 on page refresh (Vercel) | Missing SPA rewrite config | Add `vercel.json` with the rewrite rule from Step 3.5 |
| Backend 500 errors | Missing env var on Render | Check Render logs, ensure all 6 env vars from Step 2.3 are set |
| 30-60s delay on first request | Render free tier cold start | Normal — warn groupmates |
| Auth works on local but not staging | Frontend pointing at wrong Supabase | Verify `VITE_SUPABASE_URL` on Vercel matches the **staging** project, not your dev project |

---

> [!NOTE]
> **About `SUPABASE_JWT_SECRET`**: Your architecture (per ADR-003) verifies auth by calling Supabase's `/auth/v1/user` API on every request — you do NOT store or use a JWT signing secret locally. If any doc mentions needing `SUPABASE_JWT_SECRET`, that contradicts your current design. Ignore it unless you intentionally want to switch to local JWT decoding later.
