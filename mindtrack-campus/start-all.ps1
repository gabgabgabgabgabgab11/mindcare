# Start Backend, Frontend, and Cloudflare Tunnel in separate PowerShell windows

Write-Host "Starting MindTrack Campus Services..." -ForegroundColor Cyan

# 1. Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\EMMANUEL\OneDrive\Capstone-Project\mindtrack-campus\backend'; Write-Host 'Starting Backend (FastAPI)...' -ForegroundColor Green; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# 2. Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\EMMANUEL\OneDrive\Capstone-Project\mindtrack-campus\frontend\frontend'; Write-Host 'Building and starting Frontend (Preview with Proxy)...' -ForegroundColor Blue; npm run build; npm run preview"

# 3. Wait 3 seconds then start Cloudflare Tunnel
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Cloudflare Tunnel...' -ForegroundColor Yellow; & 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel --protocol http2 --url http://127.0.0.1:5173"

Write-Host "All 3 services launched in separate windows!" -ForegroundColor Green
