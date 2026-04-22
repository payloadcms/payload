#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="bench/tsgo-types-only.txt"
: > "$OUT"
echo "=== pnpm clean:build ===" | tee -a "$OUT"
pnpm clean:build >>"$OUT" 2>&1
echo "=== tsgo --build ./tsconfig.json --force (TS 7 beta) ===" | tee -a "$OUT"
/usr/bin/time -l pnpm exec tsgo --build ./tsconfig.json --force >>"$OUT" 2>&1
echo "=== DONE ===" | tee -a "$OUT"
