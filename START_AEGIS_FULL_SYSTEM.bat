@echo off
title AEGIS NER-LEWS System Launcher
color 0A
echo =====================================================================
echo           TEAM AEGIS - NER LANDSLIDE EARLY WARNING SYSTEM
echo               Smart India Hackathon 2026 Initiative
echo =====================================================================
echo.

echo [1/3] Starting Python FastAPI Backend on http://localhost:8000 ...
if exist "%~dp0venv\Scripts\python.exe" (
    start "AEGIS FastAPI Backend" cmd /k "cd /d %~dp0 && "%~dp0venv\Scripts\python.exe" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
) else (
    start "AEGIS FastAPI Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
)

timeout /t 3 /nobreak >nul

echo [2/3] Starting React Vite Frontend on http://localhost:5173 ...
start "AEGIS React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening AEGIS Control Center in Browser...
start http://localhost:5173

echo.
echo =====================================================================
echo   AEGIS System is LIVE!
echo   - Local PC:  http://localhost:5173
echo   - Backend:   http://localhost:8000/docs
echo   - Mobile:    Open the Network IP shown in the Vite terminal window
echo =====================================================================
pause