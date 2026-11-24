# 🚀 MindTrack Campus — Service Startup & venv Guide

This guide explains how to start both the **Backend** and **Frontend**, including complete virtual environment (`venv`) activation and Alembic/testing commands.

---

## 📌 At a Glance

| Service | Directory | Command | URL |
| :--- | :--- | :--- | :--- |
| **Backend (FastAPI)** | `mindtrack-campus/backend` | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| **Backend Docs** | `mindtrack-campus/backend` | *(included with backend)* | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| **Backend Health** | `mindtrack-campus/backend` | *(included with backend)* | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) |
| **Frontend (Vite/React)** | `mindtrack-campus/frontend/frontend` | `npm run dev` | [http://localhost:5173](http://localhost:5173) |

---

## 🟢 1. Starting the Backend (FastAPI + venv)

Open a **PowerShell** window.

### Step 1.1: Go to the backend folder
```powershell
cd C:\Users\EMMANUEL\Downloads\Capstone-Project1\Capstone-Project1\Capstone-Project\Capstone-Project\mindtrack-campus\backend
```

### Step 1.2: Activate the Virtual Environment (`venv`)

#### In PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```

> ⚠️ **If PowerShell shows an `Execution_Policies` script error**, run this in your terminal first:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
> .\venv\Scripts\Activate.ps1
> ```

#### In Command Prompt (`cmd.exe`):
```cmd
venv\Scripts\activate.bat
```

*(When activated, your terminal prompt will show `(venv)` on the left).*

### Step 1.3: Run the Backend Server
Once `(venv)` is activated:
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
or:
```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### ⚡ Quick Alternative: Run Backend Without Activating `venv`
You can also launch directly in one command from the `backend` folder:
```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔧 Useful Backend `venv` Commands

### Alembic Database Migrations

| Action | With Active `(venv)` | Without Activating `venv` |
| :--- | :--- | :--- |
| **Check latest migration head** | `alembic heads` | `.\venv\Scripts\python.exe -m alembic heads` |
| **Apply all pending migrations** | `alembic upgrade head` | `.\venv\Scripts\python.exe -m alembic upgrade head` |
| **Check current database revision** | `alembic current` | `.\venv\Scripts\python.exe -m alembic current` |

### Running Backend Tests (pytest)
```powershell
# With active venv:
pytest

# Without activating:
.\venv\Scripts\pytest
```

### Exit Virtual Environment
When you are done working in Python:
```powershell
deactivate
```

---

## 🔵 2. Starting the Frontend (React / Vite)

Open a **second PowerShell** window.

### Step 2.1: Go to the nested frontend directory
```powershell
cd C:\Users\EMMANUEL\Downloads\Capstone-Project1\Capstone-Project1\Capstone-Project\Capstone-Project\mindtrack-campus\frontend\frontend
```

### Step 2.2: Start the Development Server
```powershell
npm run dev
```

- **Local URL:** [http://localhost:5173](http://localhost:5173)
- **Automatic Proxy:** Vite is configured to automatically proxy all API requests from `http://localhost:5173/api/*` to the backend on `http://127.0.0.1:8000`.

### Production Build & Preview (Optional)
If you want to test the optimized production bundle locally:
```powershell
npm run build
npm run preview
```

---

## 🛑 How to Stop Services
In either terminal window, press:
```text
Ctrl + C
```
Type `Y` if prompted to terminate the batch job.
