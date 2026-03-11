#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"

stop_guard() {
  local name="$1"
  local pid_file="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      echo "$name guard stopped: $pid"
    fi
    rm -f "$pid_file"
  else
    echo "$name guard not running"
  fi
}

stop_guard "backend" "$RUNTIME_DIR/backend.guard.pid"
stop_guard "frontend" "$RUNTIME_DIR/frontend.guard.pid"
stop_guard "ngrok" "$RUNTIME_DIR/ngrok.guard.pid"

pkill -f "vite --port=3000 --host=0.0.0.0" 2>/dev/null || true
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "ngrok http 3000" 2>/dev/null || true

echo "Local demo processes stopped."
