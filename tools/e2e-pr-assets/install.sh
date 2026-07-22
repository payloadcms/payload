#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
BIN_SOURCE_DIR="${REPO_ROOT}/tools/e2e-pr-assets/bin"
BIN_TARGET_DIR="${XDG_BIN_HOME:-${HOME}/.local/bin}"
RUN_CHECK=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-check)
      RUN_CHECK=false
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: tools/e2e-pr-assets/install.sh [--no-check]" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "${BIN_SOURCE_DIR}" ]]; then
  echo "Error: script source directory not found: ${BIN_SOURCE_DIR}" >&2
  exit 1
fi

mkdir -p "${BIN_TARGET_DIR}"

SCRIPTS=(
  e2e-attach-pr
  e2e-capture-screenshot
  e2e-configure
  e2e-convert-video
  e2e-ensure-github-auth
  e2e-github-login-profile
  e2e-infer-suite
  e2e-run
  e2e-run-script
  e2e-upload-github-attachments
)

for script_name in "${SCRIPTS[@]}"; do
  source_path="${BIN_SOURCE_DIR}/${script_name}"
  target_path="${BIN_TARGET_DIR}/${script_name}"

  if [[ ! -f "${source_path}" ]]; then
    echo "Error: missing script: ${source_path}" >&2
    exit 1
  fi

  chmod +x "${source_path}"
  ln -sf "${source_path}" "${target_path}"
  echo "Linked ${target_path} -> ${source_path}"
done

if [[ ":${PATH}:" != *":${BIN_TARGET_DIR}:"* ]]; then
  echo "Warning: ${BIN_TARGET_DIR} is not in PATH for this shell."
  echo "Add this to your shell profile:"
  echo "  export PATH=\"${BIN_TARGET_DIR}:\$PATH\""
fi

if [[ "${RUN_CHECK}" == "true" ]]; then
  "${REPO_ROOT}/tools/e2e-pr-assets/check.sh"
fi
