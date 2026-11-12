#!/usr/bin/env bash
# Fills the Vigor website's VgemsAI app page with its first version, in every language, with the
# banner artwork (README: "VgemsAI app page").
#
#   apps/cms/deploy/import-app-page.sh --dry-run   # only show what would happen
#   apps/cms/deploy/import-app-page.sh             # import
#   apps/cms/deploy/import-app-page.sh --update    # replace the page's text, also once it has some
#
# Runs scripts/import-app-page.ts in the image's build stage, which has the Payload CLI (the running
# container only has the compiled server). Right after a deploy, that stage comes from the build
# cache. The banner is stored like uploads in the admin panel: in S3 when S3_BUCKET is set, otherwise
# in the CMS's "media" volume.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"
require_env_file

# The running CMS's database and upload settings. Only keys that are in .env, so that unset ones
# keep their defaults (e.g. S3_PREFIX).
env_args=()
for key in DATABASE_URL PAYLOAD_SECRET SERVER_URL S3_BUCKET S3_REGION S3_PREFIX S3_PUBLIC_URL \
  S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_ACL S3_ENDPOINT S3_FORCE_PATH_STYLE; do
  if grep -qE "^${key}=" .env; then
    env_args+=(--env "$key=$(env_value "$key")")
  fi
done

image=payload-cms-tools
# The volume the cms service keeps uploads in (docker-compose.yml, project name payload-cms)
media_volume=payload-cms_media
trap 'docker image rm "$image" >/dev/null 2>&1 || true' EXIT

echo "==> Preparing the import tool (takes ~5-10 minutes if the code changed since the last deploy)"
docker build --quiet --file Dockerfile --target builder --tag "$image" ../.. >/dev/null

docker run --rm --network host \
  "${env_args[@]}" \
  --env MEDIA_DIR=/app/media \
  --volume "$media_volume:/app/media" \
  "$image" pnpm --silent payload run scripts/import-app-page.ts "$@"

# The import runs as root; the CMS runs as `node` and must be able to replace and delete the files
docker run --rm --volume "$media_volume:/app/media" "$image" chown -R node:node /app/media
