#!/usr/bin/env bash
# Builds the CMS image from the checked-out branch and (re)starts the stack on this server.
#
#   apps/cms/deploy/deploy.sh          # deploy the code that is checked out
#   apps/cms/deploy/deploy.sh --pull   # `git pull` the current branch first
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"

require_env_file
validate_env

if [[ "${1:-}" == "--pull" ]]; then
  echo "==> Pulling latest changes for branch $(git rev-parse --abbrev-ref HEAD)"
  git pull --ff-only
fi

echo "==> Deploying commit $(git rev-parse --short HEAD)"

echo "==> Building image (first build takes ~5-10 minutes)"
docker compose build cms

echo "==> Starting containers"
docker compose up -d --remove-orphans

echo "==> Waiting for the CMS to become healthy"
container_id="$(docker compose ps -q cms)"
for _ in $(seq 1 60); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$container_id")"
  if [[ "$status" == "healthy" ]]; then
    echo "==> CMS is healthy: $(env_value SERVER_URL)/admin"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 5
done

echo "CMS did not become healthy within 5 minutes. Recent logs:" >&2
docker compose logs --tail 80 cms >&2
exit 1
