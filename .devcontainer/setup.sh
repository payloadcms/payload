#!/usr/bin/env bash
# postCreateCommand body for the devcontainer — handles both bind-mount and
# volume-clone modes from a single script. Mode is auto-detected
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

# Node + pnpm via mise, pinned by .tool-versions at the repo root
mise trust -y
mise install -y

mise exec -- pnpm config set store-dir "$WS/node_modules/.pnpm-store"

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
mkdir -p "$PNPM_HOME"

# node-gyp needs to be installed globally for pnpm i to work.
# This was added because sqlite does not come with prebuilt binaries for Node.js 24.
# Without node-gyp installed globally, sqlite will fail installation during pnpm i
mise exec -- pnpm add -g node-gyp

# confirm-modules-purge=false skips the interactive prompt during pnpm i
mise exec -- pnpm install --config.confirm-modules-purge=false
