#!/usr/bin/env bash
# Looks up the coordinates of events in Apple Maps (README: "Event locations").
#
#   apps/cms/deploy/locate-events.sh --dry-run   # only show what would be found
#   apps/cms/deploy/locate-events.sh             # events without coordinates
#   apps/cms/deploy/locate-events.sh --all       # also redo coordinates from Apple Maps
#
# Runs scripts/locate-events.ts in the image's build stage, which has the Payload CLI (the running
# container only has the compiled server). Right after a deploy, that stage comes from the build cache.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"
require_env_file

image=payload-cms-tools
trap 'docker image rm "$image" >/dev/null 2>&1 || true' EXIT

echo "==> Preparing the tool (takes ~5-10 minutes if the code changed since the last deploy)"
docker build --quiet --file Dockerfile --target builder --tag "$image" ../.. >/dev/null

docker run --rm --network host \
  --env DATABASE_URL="$(env_value DATABASE_URL)" \
  --env PAYLOAD_SECRET="$(env_value PAYLOAD_SECRET)" \
  --env SERVER_URL="$(env_value SERVER_URL)" \
  --env APPLE_MAPS_TEAM_ID="$(env_value APPLE_MAPS_TEAM_ID)" \
  --env APPLE_MAPS_KEY_ID="$(env_value APPLE_MAPS_KEY_ID)" \
  --env APPLE_MAPS_PRIVATE_KEY="$(env_value APPLE_MAPS_PRIVATE_KEY)" \
  "$image" pnpm --silent payload run scripts/locate-events.ts "$@"
