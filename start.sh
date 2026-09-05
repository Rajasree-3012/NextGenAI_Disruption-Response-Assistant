#!/usr/bin/env bash
set -e

# ── ChainGuard Supply Chain Disruption Response Assistant ──────────────────
# Single command startup: installs deps, builds frontend, runs unified server
# Usage: ./start.sh [--dev]
# Options:
#   --dev    Run Vite dev server alongside FastAPI (default: serve from build)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BACKEND_PORT="${BACKEND_PORT:-8001}"
DEV_MODE="${1:-}"

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║   ChainGuard — Supply Chain Assistant      ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# ── Python dependencies ────────────────────────────────────────────────────
echo "▸ Installing Python dependencies..."
if command -v mise &>/dev/null; then
  mise exec -- pip install -r requirements.txt -q
elif command -v pip3 &>/dev/null; then
  pip3 install -r requirements.txt -q
else
  pip install -r requirements.txt -q
fi

# Helper: run python with mise if available
PYTHON_RUN() { if command -v mise &>/dev/null; then mise exec -- "$@"; else "$@"; fi }

# ── Node dependencies ─────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "▸ Installing Node.js dependencies..."
  if command -v pnpm &>/dev/null; then
    pnpm install --silent
  else
    npm install --silent
  fi
fi

if [ "$DEV_MODE" = "--dev" ]; then
  # ── Development mode: run both servers ──────────────────────────────────
  echo "▸ Starting FastAPI backend on port $BACKEND_PORT..."
  APP_ENV=development BACKEND_PORT=$BACKEND_PORT PYTHON_RUN python -m uvicorn backend.main:app \
    --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
  BACKEND_PID=$!

  echo "▸ Starting Vite dev server..."
  echo ""
  echo "  App: http://localhost:${PORT:-8000}"
  echo "  API: http://localhost:$BACKEND_PORT"
  echo ""

  # Graceful shutdown
  trap "kill $BACKEND_PID 2>/dev/null || true" EXIT INT TERM

  if command -v pnpm &>/dev/null; then
    PORT="${PORT:-8000}" BACKEND_PORT=$BACKEND_PORT pnpm dev
  else
    PORT="${PORT:-8000}" BACKEND_PORT=$BACKEND_PORT npm run dev
  fi
else
  # ── Production mode: build then serve everything from FastAPI ────────────
  echo "▸ Building frontend..."
  if command -v pnpm &>/dev/null; then
    pnpm build
  else
    npm run build
  fi

  echo ""
  APP_PORT="${APP_PORT:-8000}"
  echo "  App: http://localhost:$APP_PORT"
  echo "  API: http://localhost:$APP_PORT/api"
  echo ""
  echo "▸ Starting server..."
  APP_ENV=production BACKEND_PORT=$APP_PORT PYTHON_RUN python backend/main.py
fi
