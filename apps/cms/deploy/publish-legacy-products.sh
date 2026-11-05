#!/usr/bin/env bash
# Publishes the products imported from the old website in every language at once
# (README: "Products from the old website").
#
#   apps/cms/deploy/publish-legacy-products.sh --with-photo --dry-run   # only show what would happen
#   apps/cms/deploy/publish-legacy-products.sh --with-photo             # publish those that have a photo
#   apps/cms/deploy/publish-legacy-products.sh --hint=likely            # publish those with this hint
#
# Products with a required field still empty are left as drafts and listed with the field to fill
# in. Runs scripts/publish-legacy-products.ts in the image's build stage, like the import scripts.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"
require_env_file

# The running CMS's database, and the website to refresh afterwards. Only keys that are in .env.
env_args=()
for key in DATABASE_URL PAYLOAD_SECRET SERVER_URL S3_BUCKET S3_REGION S3_PREFIX S3_PUBLIC_URL \
  S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_ENDPOINT S3_FORCE_PATH_STYLE \
  VIGOR_WEBSITE_URL VIGOR_WEBSITE_REVALIDATE_SECRET; do
  if grep -qE "^${key}=" .env; then
    env_args+=(--env "$key=$(env_value "$key")")
  fi
done

image=payload-cms-tools
trap 'docker image rm "$image" >/dev/null 2>&1 || true' EXIT

echo "==> Preparing the publishing tool (takes ~5-10 minutes if the code changed since the last deploy)"
docker build --quiet --file Dockerfile --target builder --tag "$image" ../.. >/dev/null

docker run --rm --network host --add-host host.docker.internal:host-gateway \
  "${env_args[@]}" \
  "$image" pnpm --silent payload run scripts/publish-legacy-products.ts "$@"
