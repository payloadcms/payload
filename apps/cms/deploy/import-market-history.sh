#!/usr/bin/env bash
# Adds ten years of prices to the VgemsAI app's Research tab, from scripts/market-history
# (README: "Market prices").
#
#   apps/cms/deploy/import-market-history.sh --dry-run   # only show what would happen
#   apps/cms/deploy/import-market-history.sh             # import
#
# Runs scripts/import-market-history.ts in the image's build stage, which has the Payload CLI (the
# running container only has the compiled server). Right after a deploy, that stage comes from the
# build cache. Days that already have a price keep it, so running it again is safe.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
  "$image" pnpm --silent payload run scripts/import-market-history.ts "$@"
