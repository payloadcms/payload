#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="bench/baseline-build-all.txt"
: > "$OUT"
echo "=== pnpm clean:build ===" | tee -a "$OUT"
pnpm clean:build >>"$OUT" 2>&1
echo "=== pnpm build:all --no-cache --force ===" | tee -a "$OUT"
/usr/bin/time -l pnpm build:all --no-cache --force >>"$OUT" 2>&1
echo "=== DONE ===" | tee -a "$OUT"
