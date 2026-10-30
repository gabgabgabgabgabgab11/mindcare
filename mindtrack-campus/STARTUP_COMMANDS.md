# 🚀 MindTrack Campus — Service Startup Guide

This document lists the exact commands to start the **Backend**, **Frontend**, and **Cloudflare Tunnel** across 3 separate PowerShell terminal windows.

---

## 📋 Quick Reference (3 Terminals)

### 🟢 Terminal 1: Backend (FastAPI)
Run from the `backend` directory:
```powershell
cd c:\Users\EMMANUEL\OneDrive\Capstone-Project\mindtrack-campus\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload 
```
- **Local Address:** `http://127.0.0.1:8000`
- **Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

---

### 🔵 Terminal 2: Frontend (React / Vite)
Run from the nested `frontend/frontend` directory:

#### Recommended for Sharing / Tunnel (Bundled & Fast):
```powershell
cd c:\Users\EMMANUEL\OneDrive\Capstone-Project\mindtrack-campus\frontend\frontend
npm run build
npm run preview
```

#### For Active Local Code Editing (Hot Module Reload):
```powershell
cd c:\Users\EMMANUEL\OneDrive\Capstone-Project\mindtrack-campus\frontend\frontend
npm run dev
```

- **Local Address:** `http://localhost:5173`
- *Note:* Vite is configured to proxy all `/api` requests automatically to `http://127.0.0.1:8000`.

---

### 🟡 Terminal 3: Cloudflare Tunnel
Run from any directory:
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --protocol http2 --url http://127.0.0.1:5173
```
- Look for the generated URL in the terminal output:
  ```text
  |  https://<random-name>.trycloudflare.com  |
  ```
- Send that `trycloudflare.com` URL to anyone or open it on your phone.

---

## 💡 Why These Specific Flags?

1. **`--protocol http2` on Cloudflare Tunnel:**
   - By default, `cloudflared` uses `quic` (UDP). Many antivirus/VPN programs (like McAfee) drop or stall QUIC packets, causing huge delays.
   - `--protocol http2` forces TCP, ensuring instant page loads without packet loss.
2. **`http://127.0.0.1:5173` instead of `localhost`:**
   - On Windows, `localhost` can attempt an IPv6 (`::1`) loopback first and time out before trying IPv4. Using `127.0.0.1` is instant.
3. **`npm run preview` for Remote Sharing:**
   - In `npm run dev`, Vite serves thousands of unbundled TypeScript modules on demand.
   - In `npm run preview`, the app is pre-bundled into a single optimized JavaScript file, loading in less than a second on mobile and remote devices.
4. **Proxying `/api` via Vite:**
   - Vite is configured in `vite.config.ts` to proxy `/api` calls directly to port `8000`.
   - This means external users and phones only need **one single URL** (the tunnel link), with zero CORS errors.
