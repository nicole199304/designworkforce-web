#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
mkdir -p "$RUNTIME_DIR"

BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"
NGROK_LOG="$RUNTIME_DIR/ngrok.log"

BACKEND_PID="$RUNTIME_DIR/backend.guard.pid"
FRONTEND_PID="$RUNTIME_DIR/frontend.guard.pid"
NGROK_PID="$RUNTIME_DIR/ngrok.guard.pid"

pkill -f "vite --port=3000 --host=0.0.0.0" 2>/dev/null || true
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "ngrok http 3000" 2>/dev/null || true
sleep 1

start_guard() {
  local name="$1"
  local pid_file="$2"
  local log_file="$3"
  local command="$4"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name guard already running: $(cat "$pid_file")"
    return
  fi

  nohup zsh -lc "
    while true; do
      echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] starting $name\" >> \"$log_file\"
      $command >> \"$log_file\" 2>&1 || true
      echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] $name exited, restarting in 2s\" >> \"$log_file\"
      sleep 2
    done
  " >/dev/null 2>&1 &

  echo $! > "$pid_file"
  echo "$name guard started: $(cat "$pid_file")"
}

start_guard "backend" "$BACKEND_PID" "$BACKEND_LOG" "cd '$ROOT_DIR' && npm start"
start_guard "frontend" "$FRONTEND_PID" "$FRONTEND_LOG" "cd '$ROOT_DIR' && npm run dev"
start_guard "ngrok" "$NGROK_PID" "$NGROK_LOG" "cd '$ROOT_DIR' && env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u all_proxy ngrok http 3000 --log stdout --log-format json"

echo
echo "Keepalive started."
echo "Use: scripts/status_local_keepalive.sh"
echo "Use: scripts/stop_local_keepalive.sh"
