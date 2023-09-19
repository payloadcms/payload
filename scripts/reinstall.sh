#!/usr/bin/env bash

# Deletes all node_modules folders and reinstalls all dependencies

set -ex

root_dir=$(git rev-parse --show-toplevel || echo .)
find "$root_dir" -name 'node_modules' -type d -prune -exec rm -rf '{}' +
pnpm install
