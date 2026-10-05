#!/usr/bin/env bash
# Imports events from a JSON file into the CMS database (README: "Importing events").
#
#   apps/cms/deploy/import-events.sh ~/exhibitions.json --dry-run   # only show what would happen
#   apps/cms/deploy/import-events.sh ~/exhibitions.json             # import
#
# Runs scripts/import-events.ts in the image's build stage, which has the Payload CLI (the running
# container only has the compiled server). Right after a deploy, that stage comes from the build cache.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

file="${1:-}"
if [[ -z "$file" || ! -f "$file" ]]; then
  echo "Usage: $0 <events.json> [--dry-run]" >&2
  exit 1
fi
file="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
shift

cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"
require_env_file

image=payload-cms-tools
trap 'docker image rm "$image" >/dev/null 2>&1 || true' EXIT

echo "==> Preparing the import tool (takes ~5-10 minutes if the code changed since the last deploy)"
docker build --quiet --file Dockerfile --target builder --tag "$image" ../.. >/dev/null

docker run --rm --network host \
  --env DATABASE_URL="$(env_value DATABASE_URL)" \
  --env PAYLOAD_SECRET="$(env_value PAYLOAD_SECRET)" \
  --env SERVER_URL="$(env_value SERVER_URL)" \
  --volume "$file:/import/events.json:ro" \
  "$image" pnpm --silent payload run scripts/import-events.ts /import/events.json "$@"
