@echo off

echo Starting backend...
start "Backend" cmd /k "cd /d "%~dp0" && uvicorn backend.main:app --reload --port 8000"

echo Starting frontend...
start "Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:8443/
echo.
pause