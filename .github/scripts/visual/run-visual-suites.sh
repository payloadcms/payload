#!/usr/bin/env bash
set -euo pipefail

# Runs `@visual`-tagged e2e tests for an explicitly-named suite, or for every suite that has at
# least one (via find-visual-suites.mjs) when no suite is given. Shared by the `visual-regression`
# CI job and `pnpm test:visual`, so both exercise the same suites instead of a single
# suite being hardcoded and every other suite's `@visual` tests silently never running in CI.
#
# Usage: run-visual-suites.sh [suite] -- [extra playwright args]

SUITE=""
if [ "$#" -gt 0 ] && [ "$1" != "--" ]; then
  SUITE="$1"
  shift
fi
if [ "$#" -gt 0 ] && [ "$1" = "--" ]; then
  shift
fi

if [ -n "$SUITE" ]; then
  SUITES="$SUITE"
else
  SUITES="$(node .github/scripts/visual/find-visual-suites.mjs)"
fi

if [ -z "$SUITES" ]; then
  echo "No @visual-tagged tests found."
  exit 0
fi

UPDATE_SNAPSHOTS=false
for arg in "$@"; do
  if [ "$arg" = "--update-snapshots" ] || [[ "$arg" == --update-snapshots=* ]]; then
    UPDATE_SNAPSHOTS=true
  fi
done

# `@visual-canary` baselines are deliberately mismatched (see test/admin/e2e/visual/e2e.spec.ts) so
# expectScreenshot always throws, exercising the diffing pipeline itself. `--update-snapshots`
# would overwrite that mismatch and make the canary stop failing — exclude it from any snapshot
# update, since a canary run only ever needs to intentionally fail, never to be refreshed.
GREP_ARGS=(--grep @visual)
if [ "$UPDATE_SNAPSHOTS" = true ]; then
  GREP_ARGS+=(--grep-invert @visual-canary)
fi

status=0
for suite in $SUITES; do
  echo "Running @visual tests in ${suite}..."
  # Distinct PLAYWRIGHT_OUTPUT_DIR per suite: Playwright clears outputDir at the start of every
  # run, so a shared directory would let this suite's run delete diff images an earlier suite in
  # this loop just failed with, before the manifest step ever reads them.
  PLAYWRIGHT_JSON_OUTPUT_NAME="results_visual_${suite}.json" \
    PLAYWRIGHT_OUTPUT_DIR="test-results/${suite}" \
    pnpm test:e2e:prod:server:run:noturbo "$suite" "${GREP_ARGS[@]}" "$@" || status=1
done

exit "$status"
