#!/usr/bin/env bash
# Usage: _build-types.sh <tool>   where <tool> is tsc or tsgo
# Iterates packages that define build:types, runs `<tool> --emitDeclarationOnly --outDir dist` in each.
# Prints per-package "status=N" lines to stdout.
set -o pipefail
cd "$(dirname "$0")/.."
TOOL="${1:?tool arg required (tsc|tsgo)}"
PKGS=$(bash bench/list-type-pkgs.sh)
for d in $PKGS; do
  cd "$d"
  if pnpm exec "$TOOL" --emitDeclarationOnly --outDir dist >/tmp/ttool.log.$$ 2>&1; then
    STATUS=0
  else
    STATUS=$?
  fi
  echo "$d status=$STATUS"
  if [ "$STATUS" != "0" ]; then
    echo "--- FAIL $d ---"
    head -40 /tmp/ttool.log.$$
    echo "---"
  fi
  rm -f /tmp/ttool.log.$$
  cd - >/dev/null
done
