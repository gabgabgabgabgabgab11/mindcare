# MindCare — Pre-Deployment Plan
**Target date:** TBD
**Stack:** React/Vite · FastAPI · Supabase Auth + PostgreSQL
**Frontend host:** Hostinger (Static / hPanel)
**Backend host:** Render *(recommended — see rationale below)*
**Identity & DB:** Supabase (production project)

---

## Why This Hosting Split?

| Layer | Host | Why |
|---|---|---|
| **Frontend** (React SPA) | Hostinger | You already have or plan a Hostinger plan; static files are trivially served from any web host |
| **Backend** (FastAPI / Python) | **Render** *(recommended)* | Hostinger shared/cloud plans do not support Python ASGI apps natively. Render has a free tier, managed HTTPS, and auto-deploys from GitHub |
| **Auth + Database** | Supabase (production project) | Managed PostgreSQL + Auth with connection pooling; keeps infrastructure minimal |

> **Hostinger VPS alternative:** If you have a Hostinger **VPS** plan (Ubuntu), you *can* run FastAPI directly there using nginx + systemd. See Appendix A at the bottom.

---

## Phase 0 — Pre-Flight Checklist (Do Before Anything Else)

### 0.1 Code Readiness

- [ ] `npm run build` completes with zero errors in `frontend/frontend/`
- [ ] Backend starts locally (`uvicorn app.main:app --reload`)
- [ ] All outstanding Git changes committed and pushed to `main`
- [ ] `.env` files are in `.gitignore` — run `git status` and confirm no `.env` is tracked
- [ ] `.env.example` contains only placeholder values (confirmed)
- [x] Alembic migration head is `e4a1d9c7b2f0` — verify with `alembic heads`

### 0.2 Secret Rotation (Critical)

> **CAUTION:** If a real database password or Supabase anon key was ever committed to Git history (even in a now-replaced file), those credentials are still readable in history. Rotate them before going live.

- [ ] **Rotate Supabase database password** — Supabase dashboard > Settings > Database > Reset password
- [ ] **Rotate Supabase anon key** if it was ever committed — Supabase > Settings > API > Roll API keys
- [ ] **Generate a NEW `JOURNAL_ENCRYPTION_KEY`** for production:

```powershell
cd "C:\Users\EMMANUEL\Downloads\Capstone-Project (new)\Capstone-Project\Capstone-Project\mindtrack-campus\backend"
.\venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

> **WARNING:** Copy and save this key in a password manager. If you lose it, all existing encrypted journal entries become permanently unreadable. Do NOT regenerate it after real data exists.

### 0.3 Domain Prep (Hostinger)

- [ ] Log in to [hPanel](https://hpanel.hostinger.com)
- [ ] Confirm you own the domain you want to use (e.g. `mindcare-pup.com`)
- [ ] Decide whether to host the frontend on the root domain or a subdomain (e.g. `app.mindcare-pup.com`)

---

## Phase 1 — Production Supabase Project

> **IMPORTANT:** Do NOT reuse your dev or staging Supabase project. Production needs its own isolated project with its own credentials.

### 1.1 Create the Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) > **New Project**
2. Name it `mindcare-production`
3. Region: **Southeast Asia (Singapore)** — closest to the Philippines
4. Set a strong database password — save in your password manager
5. Wait ~2 minutes for provisioning

### 1.2 Grab Production Credentials

From **Settings > API**:

| Credential | Location |
|---|---|
| Project URL | Settings > API > Project URL |
| Anon / public key | Settings > API > anon public |
| DB connection string | Settings > Database > Connection string > URI (Session Mode, port 5432) |

### 1.3 Configure Auth Settings

In **Authentication > URL Configuration**:

- **Site URL:** `https://yourdomain.com`
- **Redirect URLs** — add all of:
  - `https://yourdomain.com/reset-password`
  - `https://yourdomain.com/login`
  - `https://www.yourdomain.com/reset-password`
  - `https://www.yourdomain.com/login`

In **Authentication > Providers > Email**:
- [ ] Enable email confirmations for new sign-ups
- [ ] Configure SMTP sender (Supabase built-in SMTP is fine for low volume)

In **Authentication > Rate Limits**:
- [ ] Enable and record sign-in rate limit settings
- [ ] Consider enabling CAPTCHA (hCaptcha or Cloudflare Turnstile) for brute-force protection

### 1.4 Run Migrations Against Production DB

Open PowerShell — keep your dev `.env` unchanged:

```powershell
cd "C:\Users\EMMANUEL\Downloads\Capstone-Project (new)\Capstone-Project\Capstone-Project\mindtrack-campus\backend"

$env:DATABASE_URL        = "postgresql+psycopg2://postgres.[PROD_REF]:[PROD_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
$env:SUPABASE_URL        = "https://[PROD_REF].supabase.co"
$env:SUPABASE_ANON_KEY   = "[PROD_ANON_KEY]"
$env:JOURNAL_ENCRYPTION_KEY = "[NEW_FERNET_KEY_FROM_PHASE_0]"

.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m alembic heads   # must show e4a1d9c7b2f0
```

### 1.5 Create Production Accounts

In **Authentication > Users > Add User**:

| Account | Email | Notes |
|---|---|---|
| Admin | `admin@yourdomain.com` | Set `role = 'admin'` in the `profiles` table after creation |
| Demo student | `demo@yourdomain.com` | Default student role |

---

## Phase 2 — Backend Deployment (Render)

### 2.1 Create a Render Web Service

1. Go to [render.com](https://render.com) > New > Web Service
2. Connect your GitHub repo
3. Settings:

| Setting | Value |
|---|---|
| Name | `mindcare-api` |
| Region | `Oregon (US West)` or `Singapore` |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | Free (upgrade to Starter $7/mo for no cold starts) |

### 2.2 Set Environment Variables on Render

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://postgres.[PROD_REF]:[PASS]@...pooler.supabase.com:5432/postgres` |
| `SUPABASE_URL` | `https://[PROD_REF].supabase.co` |
| `SUPABASE_ANON_KEY` | `[production anon key]` |
| `JOURNAL_ENCRYPTION_KEY` | `[Fernet key from Phase 0.2]` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://yourdomain.com,https://www.yourdomain.com` |
| `CURRENT_CONSENT_VERSION` | `1.0` |

> **WARNING:** Set `CORS_ORIGINS` to your exact Hostinger domain — no trailing slashes. If you later add a custom API subdomain, include it here too.

### 2.3 Deploy and Verify

After clicking **Create Web Service**, Render will clone the repo, install dependencies, and start uvicorn. Verify:

```
GET https://mindcare-api.onrender.com/health
Expected: {"status": "ok", ...}
```

> **Note:** Free tier Render services sleep after 15 minutes of inactivity. First request after sleep takes 30–60 seconds. Upgrade to Starter ($7/mo) for production without cold starts.

### 2.4 Custom API Domain (Optional)

If you want `api.yourdomain.com` instead of the Render URL:
1. Render > your service > Settings > Custom Domains > Add `api.yourdomain.com`
2. Render gives you a CNAME value
3. Add that CNAME in Hostinger DNS (hPanel > Domains > DNS Zone Editor)
4. Update `CORS_ORIGINS` and `VITE_API_BASE_URL` accordingly

---

## Phase 3 — Frontend Deployment (Hostinger)

### 3.1 Build the Production Bundle

Create a production `.env` file in `frontend/frontend/` (do NOT commit this):

```
VITE_API_BASE_URL=https://mindcare-api.onrender.com
VITE_SUPABASE_URL=https://[PROD_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[PROD_ANON_KEY]
```

Then build:

```powershell
cd "C:\Users\EMMANUEL\Downloads\Capstone-Project (new)\Capstone-Project\Capstone-Project\mindtrack-campus\frontend\frontend"
npm run build
```

Output files will be in `frontend/frontend/dist/`.

### 3.2 Upload to Hostinger

**Option A — hPanel File Manager (Simplest)**
1. Log in to [hPanel](https://hpanel.hostinger.com)
2. Go to **Files > File Manager**
3. Navigate to `public_html/`
4. Delete any existing files in `public_html/`
5. Upload the **contents** of `dist/` (not the folder itself) into `public_html/`
6. Confirm `index.html` is directly at `public_html/index.html`

**Option B — FTP/SFTP (Best for Repeat Deploys)**
1. hPanel > Files > FTP Accounts — note hostname, username, password
2. Use FileZilla or WinSCP; connect and upload `dist/` contents to `public_html/`

### 3.3 Fix SPA Routing — CRITICAL, DO NOT SKIP

React Router requires all URL paths to serve `index.html`. Without this, any direct URL or page refresh shows a **404** from Apache.

Create a `.htaccess` file inside `public_html/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

This must be uploaded alongside your `index.html`. Verify by navigating directly to `https://yourdomain.com/dashboard` — it should load the React app, not a 404.

### 3.4 Enable HTTPS / SSL

1. hPanel > **Security > SSL**
2. Enable **Free SSL (Let's Encrypt)** for your domain
3. Enable **Force HTTPS redirect**

Verify:
- `https://yourdomain.com` loads the login page
- `http://yourdomain.com` automatically redirects to `https://`

### 3.5 DNS Configuration

If your domain is registered on Hostinger, DNS is already in hPanel. If registered elsewhere, either:
- Transfer nameservers to Hostinger NS values shown in hPanel, OR
- Add an A record at your registrar pointing to your Hostinger IP

To find your Hostinger IP: hPanel > Hosting > Manage > find the IP address listed.

---

## Phase 4 — Security Hardening Before Go-Live

### 4.1 Secret Audit

- [ ] Run: `git log --all --oneline -p | Select-String -Pattern "password|secret|fernet|anon"` — confirm no real values appear
- [ ] `VITE_` env vars baked into the build are intentionally public (anon key, API URL only) — no backend secrets in the frontend
- [ ] `JOURNAL_ENCRYPTION_KEY` exists only in Render's environment variables

### 4.2 Supabase Row-Level Security

- [ ] RLS is enabled on: `profiles`, `journals`, `wellness_checkins`, `mantra_wall_posts`
- [ ] Test that one student cannot read another student's data

### 4.3 CORS Verification

Open browser DevTools on the deployed site:
- Console: no `Access-Control-Allow-Origin` errors
- Network tab: API calls return 200, not blocked

### 4.4 Rate Limiting

- [ ] Supabase Auth rate limits enabled (Phase 1.3)
- [ ] In-browser 5-attempt / 15-minute login pause is live
- [ ] `slowapi` rate-limit headers appear on API responses

---

## Phase 5 — Smoke Tests (Run After Every Deploy)

Use a private/incognito window for all tests:

| # | Test | Expected |
|---|---|---|
| 1 | Open `https://yourdomain.com` | Login page loads, no console errors |
| 2 | Open `https://yourdomain.com/dashboard` directly (not via app) | Redirects to `/login`, not a 404 |
| 3 | Submit wrong password 5 times | Lockout message; sign-in disabled for 15 min |
| 4 | Click Forgot? > submit email | Generic success message (no account enumeration) |
| 5 | Open reset-password link from email | `/reset-password` page loads; new password accepted |
| 6 | Log in as student | Routes to onboarding/dashboard |
| 7 | Log in as admin | Routes to admin dashboard |
| 8 | Refresh page while logged in | Session persists |
| 9 | Save pet nickname | Nickname persists after logout > login > different browser |
| 10 | Write journal entry | Entry visible on next load |
| 11 | Log out | Back button cannot reopen protected pages |
| 12 | Test at 125% and 150% browser zoom | Layout stays usable |
| 13 | Test on 375px mobile width | No horizontal overflow |

---

## Phase 6 — Go-Live Checklist

- [ ] Phase 0 complete (code ready, secrets rotated)
- [ ] Phase 1 complete (production Supabase, migrations at `e4a1d9c7b2f0`)
- [ ] Phase 2 complete (Render deployed, `/health` returns 200)
- [ ] Phase 3 complete (Hostinger files uploaded, `.htaccess` present, HTTPS active)
- [ ] Phase 4 complete (CORS verified, RLS confirmed, rate limits active)
- [ ] Phase 5 all 13 smoke tests passing
- [ ] `CORS_ORIGINS` on Render matches the exact Hostinger domain(s)
- [ ] `VITE_API_BASE_URL` in the built bundle points to the production Render URL
- [ ] Supabase redirect URLs include `https://yourdomain.com/reset-password`
- [ ] Admin account exists with `role = 'admin'` in `profiles`

---

## Appendix A — Hostinger VPS Path (Advanced Alternative)

If you have a Hostinger **VPS** plan (Ubuntu 20.04/22.04), you can host FastAPI there and skip Render entirely.

### A.1 Server Setup

```bash
ssh root@your-vps-ip

apt update && apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git
git clone https://github.com/youruser/mindtrack-campus.git /opt/mindcare
cd /opt/mindcare/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### A.2 Environment File

```bash
nano /opt/mindcare/backend/.env
# Paste production env vars
```

### A.3 Systemd Service

Create `/etc/systemd/system/mindcare-api.service`:

```ini
[Unit]
Description=MindCare FastAPI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/mindcare/backend
ExecStart=/opt/mindcare/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
EnvironmentFile=/opt/mindcare/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable mindcare-api
systemctl start mindcare-api
```

### A.4 Nginx Reverse Proxy

Create `/etc/nginx/sites-available/mindcare-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/mindcare-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.yourdomain.com
```

### A.5 Future Deploys on VPS

```bash
cd /opt/mindcare && git pull origin main
cd backend && source venv/bin/activate
pip install -r requirements.txt       # if requirements changed
python3 -m alembic upgrade head        # if new migrations exist
systemctl restart mindcare-api
```

---

## Appendix B — Recommended Service Summary

| Service | Purpose | Cost | Link |
|---|---|---|---|
| Hostinger | Frontend static hosting | Your plan | hostinger.com |
| Render | FastAPI backend (recommended) | Free / $7/mo Starter | render.com |
| Supabase | Auth + PostgreSQL | Free up to 500 MB / 50K MAU | supabase.com |
| GitHub | Source control + auto-deploy trigger | Free | github.com |
| Cloudflare (optional) | CDN + DDoS + free SSL proxy | Free | cloudflare.com |

> **TIP — Cloudflare is highly recommended** even on a free plan. Point your domain's nameservers to Cloudflare, proxy your A record, and you get: free SSL, global CDN caching for static assets, automatic DDoS mitigation, and Web Analytics — at no extra cost.

---

## Appendix C — Production Credentials Template

Keep this in a private document — NOT in the repo:

```
=== PRODUCTION ===
Frontend URL:         https://yourdomain.com
Backend (Render) URL: https://mindcare-api.onrender.com
Supabase Project URL: https://[PROD_REF].supabase.co

=== ENVIRONMENT VARIABLES ===
DATABASE_URL:            postgresql+psycopg2://postgres.[ref]:[pass]@...
SUPABASE_URL:            https://[PROD_REF].supabase.co
SUPABASE_ANON_KEY:       eyJhbGci...
JOURNAL_ENCRYPTION_KEY:  [your Fernet key — NEVER LOSE THIS]
CORS_ORIGINS:            https://yourdomain.com,https://www.yourdomain.com
CURRENT_CONSENT_VERSION: 1.0

=== PRODUCTION ACCOUNTS ===
Admin:  admin@yourdomain.com / [password]
Demo:   demo@yourdomain.com  / [password]
```

---

*Last updated: 2026-10-23 | MindCare Development Team*
