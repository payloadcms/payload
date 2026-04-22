#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="bench/tsgo-sweep.txt"
: > "$OUT"

run_one() {
  local label="$1"
  shift
  echo "=== $label (tsgo $*) ===" | tee -a "$OUT"
  pnpm clean:build >/dev/null 2>&1
  /usr/bin/time -l pnpm exec tsgo "$@" --build ./tsconfig.json --force >>"$OUT" 2>&1
  echo "=== end $label ===" | tee -a "$OUT"
}

run_one "checkers=1"  --checkers 1
run_one "checkers=2"  --checkers 2
run_one "checkers=4"  --checkers 4
run_one "checkers=8"  --checkers 8
run_one "checkers=12" --checkers 12
run_one "checkers=8 builders=8" --checkers 8 --builders 8
run_one "checkers=12 builders=8" --checkers 12 --builders 8

echo "ALL DONE" | tee -a "$OUT"
