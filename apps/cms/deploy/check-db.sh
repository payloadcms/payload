#!/usr/bin/env bash
# Verifies that this server can reach and authenticate against MongoDB with DATABASE_URL
# from apps/cms/.env. Uses a throwaway mongosh container, so nothing needs to be installed.
#
#   apps/cms/deploy/check-db.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# shellcheck source=SCRIPTDIR/lib.sh
source "$APP_DIR/deploy/lib.sh"

require_env_file
database_url="$(env_value DATABASE_URL)"

echo "==> Connecting to MongoDB (credentials hidden): $(sed -E 's#://[^@]+@#://***@#' <<<"$database_url")"

docker run --rm mongo:8 mongosh "$database_url" --quiet --eval '
  const ping = db.runCommand({ ping: 1 })
  const info = db.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUsers
  print(`ping ok: ${ping.ok === 1}`)
  print(`database: ${db.getName()}`)
  print(`authenticated as: ${JSON.stringify(info)}`)
  db.getCollection("__payload_deploy_check").insertOne({ checkedAt: new Date() })
  db.getCollection("__payload_deploy_check").drop()
  print("write access: ok")
'
