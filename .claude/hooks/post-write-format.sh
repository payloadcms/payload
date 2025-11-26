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
    npx sort-package-json "$FILE" 2>/dev/null
    ;;
  *.yml|*.json)
    npx prettier --write "$FILE" 2>/dev/null
    ;;
  *.md|*.mdx)
    npx prettier --write "$FILE" 2>/dev/null
    if command -v markdownlint >/dev/null 2>&1; then
      markdownlint -i node_modules "$FILE" 2>/dev/null
    fi
    ;;
  *.js|*.jsx|*.ts|*.tsx)
    npx prettier --write "$FILE" 2>/dev/null
    npx eslint --cache --fix "$FILE" 2>/dev/null
    ;;
esac

exit 0
