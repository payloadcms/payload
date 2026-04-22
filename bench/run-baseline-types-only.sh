#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="bench/baseline-types-only.txt"
: > "$OUT"
echo "=== pnpm clean:build ===" | tee -a "$OUT"
pnpm clean:build >>"$OUT" 2>&1
echo "=== tsc --build ./tsconfig.json --force (tsc 5.7.3) ===" | tee -a "$OUT"
/usr/bin/time -l pnpm exec tsc --build ./tsconfig.json --force >>"$OUT" 2>&1
echo "=== DONE ===" | tee -a "$OUT"
