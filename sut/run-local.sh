#!/usr/bin/env bash
# Runs the pinned app without Docker, using in-memory SQLite. Restarting resets the data.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
DIR="$ROOT/.sut-local"
PIDFILE="$DIR/sut.pid"
set -a; . "$HERE/.env"; set +a

start() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "already running (pid $(cat "$PIDFILE"))"; return
  fi
  if [ ! -d "$DIR/app/.git" ]; then
    mkdir -p "$DIR/app"
    git -C "$DIR/app" init -q
    git -C "$DIR/app" remote add origin "$SUT_REPO"
    git -C "$DIR/app" fetch -q --depth 1 origin "$SUT_SHA"
    git -C "$DIR/app" checkout -q FETCH_HEAD
    (cd "$DIR/app" && npm ci --no-audit --no-fund && npm install -w backend sqlite3 --no-audit --no-fund --no-save && npm run build -w frontend)
  fi
  # PROD_DB_HOSTNAME is used by sequelize as the sqlite storage path, so ':memory:' keeps the DB out of the checkout.
  cd "$DIR/app/backend"
  NODE_ENV=production PORT=3001 JWT_KEY=local-only \
    PROD_DB_DIALECT=sqlite PROD_DB_USERNAME=x PROD_DB_PASSWORD=x PROD_DB_NAME=x PROD_DB_HOSTNAME=':memory:' \
    nohup node index.js > "$DIR/sut.log" 2>&1 < /dev/null &
  echo $! > "$PIDFILE"
  cd "$ROOT"
  for _ in $(seq 1 60); do
    if curl -fsS http://localhost:3001/api/articles >/dev/null 2>&1; then echo "app ready on :3001"; return; fi
    sleep 1
  done
  echo "app did not become ready; see $DIR/sut.log" >&2; exit 1
}

stop() {
  if [ -f "$PIDFILE" ]; then kill "$(cat "$PIDFILE")" 2>/dev/null || true; rm -f "$PIDFILE"; fi
  echo "stopped"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *) echo "usage: $0 start|stop" >&2; exit 2 ;;
esac
