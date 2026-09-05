@echo off

echo Starting backend...
start "Backend" cmd /k "cd /d "%~dp0" && set APP_ENV=development && uvicorn backend.main:app --reload --port 8001"

echo Starting frontend...
start "Frontend" cmd /k "cd /d "%~dp0" && set PORT=8000 && set BACKEND_PORT=8001 && npm run dev"

echo.
echo Backend: http://127.0.0.1:8001
echo Frontend: http://localhost:8000/
echo.
pause
