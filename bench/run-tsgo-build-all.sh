#!/usr/bin/env bash
# Temporarily rewrites each package's build:types script to use tsgo, runs build:all, then reverts.
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="bench/tsgo-build-all.txt"
: > "$OUT"

if ! git diff --quiet -- 'packages/*/package.json'; then
  echo "ERROR: packages/*/package.json has uncommitted changes; refusing to run" | tee -a "$OUT"
  exit 1
fi

PKGS=$(bash bench/list-type-pkgs.sh)

echo "=== rewriting build:types to use tsgo ===" | tee -a "$OUT"
for d in $PKGS; do
  node -e "
    const fs = require('fs');
    const path = process.argv[1] + '/package.json';
    const j = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (j.scripts && j.scripts['build:types']) {
      j.scripts['build:types'] = j.scripts['build:types'].replace(/\\btsc\\b/, 'tsgo');
    }
    fs.writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
  " "$d"
done

echo "=== pnpm clean:build ===" | tee -a "$OUT"
pnpm clean:build >>"$OUT" 2>&1

echo "=== pnpm build:all --no-cache --force --continue (with tsgo) ===" | tee -a "$OUT"
/usr/bin/time -l pnpm build:all --no-cache --force --continue >>"$OUT" 2>&1
STATUS=$?

echo "=== reverting package.json changes ===" | tee -a "$OUT"
git checkout -- 'packages/*/package.json' >>"$OUT" 2>&1

echo "=== DONE (status=$STATUS) ===" | tee -a "$OUT"
exit 0
