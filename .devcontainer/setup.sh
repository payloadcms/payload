#!/usr/bin/env bash
set -euo pipefail

WS="$(pwd)"

if [ "$(stat -c '%u' "$WS")" = "0" ]; then
  # Volume-clone: whole workspace was cloned as root; rehome it.
  sudo chown -R vscode:vscode "$WS"
else
  # Bind-mount: only the fresh node_modules named volume is root-owned.
  sudo chown vscode:vscode "$WS/node_modules"
fi

# Seed .env when absent
[ -f .env ] || cp .devcontainer/.env.example .env
