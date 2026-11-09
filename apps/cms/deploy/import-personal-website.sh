#!/usr/bin/env bash
# Copies the personal website's current pages and projects, with their images and icons, into the CMS
# (README: "Personal website").
#
#   apps/cms/deploy/import-personal-website.sh https://github.com/atorpos/personalwebsite --dry-run   # only show what would happen
#   apps/cms/deploy/import-personal-website.sh https://github.com/atorpos/personalwebsite             # import
#   apps/cms/deploy/import-personal-website.sh ~/personalwebsite                                      # a checkout on this server
#
# A repository URL is cloned (its default branch, or <url>#<branch>) into a temporary folder. Runs
# scripts/import-personal-website.ts in the image's build stage, which has the Payload CLI (the running
# container only has the compiled server). Right after a deploy, that stage comes from the build cache.
# Images are stored like uploads in the admin panel: in S3 when S3_BUCKET is set, otherwise in the
# CMS's "media" volume.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

website="${1:-}"
if [[ -z "$website" || "$website" == -* ]]; then
  echo "Usage: $0 <website-repo-url-or-folder> [--dry-run]" >&2
  echo "  e.g. $0 https://github.com/atorpos/personalwebsite --dry-run" >&2
  exit 1
fi
shift

cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"
require_env_file

image=payload-cms-tools
# The volume the cms service keeps uploads in (docker-compose.yml, project name payload-cms)
media_volume=payload-cms_media
checkout=""

cleanup() {
  docker image rm "$image" >/dev/null 2>&1 || true
  if [[ -n "$checkout" ]]; then
    rm -rf "$checkout"
  fi
}
trap cleanup EXIT

if [[ -d "$website" ]]; then
  website_dir="$(cd "$website" && pwd)"
else
  checkout="$(mktemp -d)"
  repository="${website%%#*}"
  branch_args=()
  if [[ "$website" == *#* ]]; then
    branch_args=(--branch "${website#*#}")
  fi

  echo "==> Downloading $website"
  git clone --quiet --depth 1 "${branch_args[@]}" "$repository" "$checkout/website"
  website_dir="$checkout/website"
fi

# The running CMS's database and upload settings. Only keys that are in .env, so that unset ones
# keep their defaults (e.g. S3_PREFIX).
env_args=()
for key in DATABASE_URL PAYLOAD_SECRET SERVER_URL S3_BUCKET S3_REGION S3_PREFIX S3_PUBLIC_URL \
  S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_ACL S3_ENDPOINT S3_FORCE_PATH_STYLE; do
  if grep -qE "^${key}=" .env; then
    env_args+=(--env "$key=$(env_value "$key")")
  fi
done

echo "==> Preparing the import tool (takes ~5-10 minutes if the code changed since the last deploy)"
docker build --quiet --file Dockerfile --target builder --tag "$image" ../.. >/dev/null

docker run --rm --network host \
  "${env_args[@]}" \
  --env MEDIA_DIR=/app/media \
  --volume "$media_volume:/app/media" \
  --volume "$website_dir:/website:ro" \
  "$image" pnpm --silent payload run scripts/import-personal-website.ts /website "$@"

# The import runs as root; the CMS runs as `node` and must be able to replace and delete the files
docker run --rm --volume "$media_volume:/app/media" "$image" chown -R node:node /app/media
