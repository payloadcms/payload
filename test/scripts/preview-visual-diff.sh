#!/usr/bin/env bash
set -euo pipefail

# Runs a suite's `@visual` tests in the same Docker environment as `test:visual`, then
# opens Playwright's interactive HTML report (actual/expected/diff tabs, plus a slider to compare
# them) for the result — faster to read than opening the raw actual/expected/diff PNGs by hand.
#
# Usage: pnpm test:visual:preview <suite>

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

SUITE="${1:-}"
if [ -z "$SUITE" ]; then
  echo "Usage: pnpm test:visual:preview <suite>" >&2
  exit 1
fi
shift

REPORT_DIR="test/playwright-report/${SUITE}"
rm -rf "$REPORT_DIR"

set +e
PLAYWRIGHT_HTML_REPORT="$REPORT_DIR" bash "$REPO_ROOT/test/scripts/run-visual-docker.sh" "$SUITE" "$@"
RUN_STATUS=$?
set -e

if [ ! -f "$REPORT_DIR/index.html" ]; then
  echo "No HTML report was generated at $REPORT_DIR — the container likely failed before Playwright ran. Check the output above." >&2
  exit "$RUN_STATUS"
fi

npx playwright show-report "$REPORT_DIR"

exit "$RUN_STATUS"
