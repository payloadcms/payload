#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

missing=0

require_cmd() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    missing=1
  fi
}

require_cmd gh
require_cmd jq
require_cmd pnpm
require_cmd ffmpeg
require_cmd ffprobe
require_cmd bc
require_cmd node
require_cmd python3

SCRIPTS=(
  e2e-attach-pr
  e2e-capture-screenshot
  e2e-convert-video
  e2e-github-login-profile
  e2e-infer-suite
  e2e-run
  e2e-run-script
  e2e-upload-github-attachments
)

for script_name in "${SCRIPTS[@]}"; do
  script_path="${REPO_ROOT}/tools/e2e-pr-assets/bin/${script_name}"
  if [[ ! -x "${script_path}" ]]; then
    echo "Missing or non-executable helper: ${script_path}" >&2
    missing=1
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  echo "Warning: gh is not authenticated. Run: gh auth login" >&2
fi

if ! (
  cd "${REPO_ROOT}"
  node -e "require.resolve('@playwright/test')"
) >/dev/null 2>&1; then
  echo "Warning: @playwright/test is not resolvable from repo root. Install dependencies (pnpm install)." >&2
fi

if [[ "${missing}" -ne 0 ]]; then
  exit 1
fi

echo "e2e-pr-assets prerequisite check passed"
