#!/usr/bin/env bash
# Adds the Privacy Policy and Terms of Use of the VgemsAI app and the Vigor website to Pages, as
# drafts (README: "Privacy policy and terms of use").
#
#   apps/cms/deploy/import-legal-pages.sh --dry-run   # only show what would happen
#   apps/cms/deploy/import-legal-pages.sh             # import
#   apps/cms/deploy/import-legal-pages.sh --update    # also replace the text of pages that exist
#
# Runs scripts/import-legal-pages.ts in the image's build stage, which has the Payload CLI (the
# running container only has the compiled server). Right after a deploy, that stage comes from the
# build cache.
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
  "$image" pnpm --silent payload run scripts/import-legal-pages.ts "$@"
