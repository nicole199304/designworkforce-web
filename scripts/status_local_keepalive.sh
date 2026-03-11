#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"

show_guard() {
  local name="$1"
  local pid_file="$2"
  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name: running (guard pid $(cat "$pid_file"))"
  else
    echo "$name: stopped"
  fi
}

show_guard "backend" "$RUNTIME_DIR/backend.guard.pid"
show_guard "frontend" "$RUNTIME_DIR/frontend.guard.pid"
show_guard "ngrok" "$RUNTIME_DIR/ngrok.guard.pid"

echo
lsof -nP -iTCP:3000 -sTCP:LISTEN 2>/dev/null || true
lsof -nP -iTCP:3001 -sTCP:LISTEN 2>/dev/null || true

echo
if [[ -f "$RUNTIME_DIR/ngrok.log" ]]; then
  URL="$(rg -o 'https://[^"]+ngrok-free\.dev' "$RUNTIME_DIR/ngrok.log" | tail -n 1 || true)"
  if [[ -n "${URL:-}" ]]; then
    echo "Public URL: $URL"
  else
    echo "Public URL: not ready"
  fi
else
  echo "Public URL: no ngrok log yet"
fi
