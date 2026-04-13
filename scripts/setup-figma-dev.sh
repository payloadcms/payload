#!/bin/bash
set -e

# Get the absolute path to the repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENTERPRISE_DIR="$REPO_ROOT/../enterprise-plugins"

echo "Checking for enterprise-plugins at $ENTERPRISE_DIR..."

if [ ! -d "$ENTERPRISE_DIR" ]; then
    echo "Directory not found. Cloning enterprise-plugins..."
    # Using git clone
    git clone https://github.com/payloadcms/enterprise-plugins "$ENTERPRISE_DIR"
else
    echo "enterprise-plugins found."
fi

# Install dependencies in enterprise-plugins
echo "Installing dependencies in enterprise-plugins..."
cd "$ENTERPRISE_DIR"
pnpm install
cd "$REPO_ROOT"

# Remove local file dependency from test/package.json if it exists
# We want to rely on the vitest alias instead of package.json file: protocol
if grep -q "@payloadcms/figma" "$REPO_ROOT/test/package.json"; then
    echo "Removing @payloadcms/figma from test/package.json dependencies..."
    cd "$REPO_ROOT/test"
    pnpm remove @payloadcms/figma || true # ignore if not found by pnpm but grep found it
    cd "$REPO_ROOT"
fi

echo "Setup complete. You can now run 'PAYLOAD_DATABASE=content-api pnpm test:int _community'."
