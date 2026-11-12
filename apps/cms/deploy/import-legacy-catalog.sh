#!/usr/bin/env bash
# Copies the old Vigor website's products into the CMS as drafts, with their photos, to check them
# in the admin panel before publishing (README: "Products from the old website").
#
#   apps/cms/deploy/import-legacy-catalog.sh ~/old_vgems --dry-run            # only show what would happen
#   apps/cms/deploy/import-legacy-catalog.sh ~/old_vgems                      # import
#   apps/cms/deploy/import-legacy-catalog.sh ~/old_vgems --only-legit         # only products marked "legit": true
#   apps/cms/deploy/import-legacy-catalog.sh ~/old_vgems --hint=likely,check  # only products with these hints
#
# ~/old_vgems is a checkout of atorpos/old_vgems with export/legacy-catalog.json. More options in
# scripts/import-legacy-catalog.ts. Runs that script in the image's build stage, like import-vigor.sh,
# with the folder mounted read-only. Photos are stored like uploads in the admin panel: in S3 when
# S3_BUCKET is set, otherwise in the CMS's "media" volume.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

old_dir="${1:-}"
if [[ -z "$old_dir" || "$old_dir" == -* ]]; then
  echo "Usage: $0 <old_vgems folder> [--dry-run] [--only-legit] [--hint=likely,check] [--no-images] [--catalog=<file>]" >&2
  exit 1
fi
shift

if [[ ! -d "$old_dir" ]]; then
  echo "$old_dir is not a folder. Use a checkout of atorpos/old_vgems." >&2
  exit 1
fi
old_dir="$(cd "$old_dir" && pwd)"

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

docker run --rm --network host --add-host host.docker.internal:host-gateway \
  "${env_args[@]}" \
  --env MEDIA_DIR=/app/media \
  --volume "$media_volume:/app/media" \
  --volume "$old_dir:/old-website:ro" \
  "$image" pnpm --silent payload run scripts/import-legacy-catalog.ts /old-website "$@"

# The import runs as root; the CMS runs as `node` and must be able to replace and delete the files
docker run --rm --volume "$media_volume:/app/media" "$image" chown -R node:node /app/media
