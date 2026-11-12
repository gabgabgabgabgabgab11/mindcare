# Start Backend, Frontend, and Cloudflare Tunnel in separate PowerShell windows

Write-Host "Starting MindTrack Campus Services..." -ForegroundColor Cyan

$baseDir = $PSScriptRoot

# 1. Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; Write-Host 'Starting Backend (FastAPI)...' -ForegroundColor Green; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# 2. Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend\frontend'; Write-Host 'Starting Frontend (Dev Server)...' -ForegroundColor Blue; npm run dev"

# 3. Wait 3 seconds then start Cloudflare Tunnel
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Cloudflare Tunnel...' -ForegroundColor Yellow; & 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel --protocol http2 --url http://127.0.0.1:5173"

Write-Host "All 3 services launched in separate windows!" -ForegroundColor Green
