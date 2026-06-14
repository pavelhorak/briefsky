#!/usr/bin/env bash
set -euo pipefail

HOST="${BRIEFSKY_HOST:-root@homeassistant.local}"
REMOTE="${BRIEFSKY_REMOTE:-/config/www/briefsky}"
KEEP_OLD_SW="${BRIEFSKY_KEEP_OLD_SW:-3}"

cd "$(dirname "$0")/.."

echo "==> Building..."
npm run build

echo "==> Querying remote for highest swN.js..."
LAST_N=$(ssh "$HOST" "ls $REMOTE/sw*.js 2>/dev/null" \
  | grep -oE 'sw[0-9]+\.js$' \
  | grep -oE '[0-9]+' \
  | sort -n \
  | tail -1 || true)
NEXT_N=$((${LAST_N:-0} + 1))
NEW_SW="sw${NEXT_N}.js"
echo "    last=sw${LAST_N:-none}.js, next=${NEW_SW}"

echo "==> Renaming sw.js -> ${NEW_SW} and patching registerSW.js..."
mv "dist/sw.js" "dist/${NEW_SW}"
sed -i.bak "s|'./sw\.js'|'./${NEW_SW}'|g" dist/registerSW.js
rm dist/registerSW.js.bak

echo "==> Uploading to ${HOST}:${REMOTE}/..."
scp -q -r dist/* "${HOST}:${REMOTE}/"

if [ "$KEEP_OLD_SW" -gt 0 ]; then
  echo "==> Pruning old swN.js (keep last ${KEEP_OLD_SW})..."
  ssh "$HOST" "cd $REMOTE && \
    ls sw*.js 2>/dev/null \
    | grep -E '^sw[0-9]+\.js$' \
    | sort -t w -k2 -n \
    | head -n -${KEEP_OLD_SW} \
    | xargs -r rm -v" || true
fi

echo "==> Deployed ${NEW_SW}."
