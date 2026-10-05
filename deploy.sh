#!/usr/bin/env bash
# Deploy grants-mcp to the ATH server and restart it under pm2.
# Usage: bash deploy.sh            # build, sync, install, restart
#        bash deploy.sh --no-restart

set -euo pipefail

SERVER="root@192.168.86.110"
REMOTE="/opt/grants-mcp"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[deploy] Building"
(cd "$LOCAL_DIR" && npm run build)

echo "[deploy] Syncing dist/, package files and ecosystem config"
ssh "$SERVER" "mkdir -p $REMOTE && rm -rf $REMOTE/dist"
scp -rq "$LOCAL_DIR/dist" "$SERVER:$REMOTE/"
scp -q "$LOCAL_DIR/package.json" "$LOCAL_DIR/package-lock.json" "$LOCAL_DIR/ecosystem.config.cjs" "$SERVER:$REMOTE/"

echo "[deploy] Installing production dependencies"
ssh "$SERVER" "cd $REMOTE && npm ci --omit=dev --no-audit --no-fund"

if [[ "${1:-}" == "--no-restart" ]]; then
  echo "[deploy] Done (no restart requested)"
  exit 0
fi

echo "[deploy] Starting or restarting grants-mcp"
ssh "$SERVER" "cd $REMOTE && (pm2 describe grants-mcp >/dev/null 2>&1 && pm2 restart grants-mcp --update-env || pm2 start ecosystem.config.cjs) && pm2 save"
echo "[deploy] Done"
