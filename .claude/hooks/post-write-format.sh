#!/bin/bash

# Post-write hook to format files after creating
# This is the bash equivalent of lint-staged in package.json

# To test this file directly via cli:
# echo '{"tool_input": {"file_path": "path/to/your/file"}}' | .claude/hooks/post-write-format.sh

# Read JSON from stdin and extract file path
FILE=$(jq -r '.tool_input.file_path' 2>/dev/null)

if [ -z "$FILE" ] || [ "$FILE" = "null" ]; then
  exit 0
fi

# Check if file exists
if [ ! -f "$FILE" ]; then
  exit 0
fi

# Format based on file type
case "$FILE" in
  */package.json)
    pnpm sort-package-json "$FILE" >/dev/null 2>&1
    ;;
  *.yml|*.json)
    pnpm prettier --write "$FILE" >/dev/null 2>&1
    ;;
  *.md|*.mdx)
    pnpm prettier --write "$FILE" >/dev/null 2>&1
    if command -v markdownlint >/dev/null 2>&1; then
      markdownlint -i node_modules "$FILE" >/dev/null 2>&1
    fi
    ;;
  *.js|*.jsx|*.ts|*.tsx)
    pnpm eslint --flag v10_config_lookup_from_file --cache --fix "$FILE" >/dev/null 2>&1
    pnpm prettier --write "$FILE" >/dev/null 2>&1
    ;;
esac

exit 0
