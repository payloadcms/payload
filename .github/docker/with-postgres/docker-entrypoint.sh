#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  attempts="${DATABASE_WAIT_MAX_ATTEMPTS:-60}"
  interval="${DATABASE_WAIT_INTERVAL_SECONDS:-2}"
  count=0

  until pg_isready -d "${DATABASE_URL}" >/dev/null 2>&1; do
    count=$((count + 1))
    if [ "${count}" -ge "${attempts}" ]; then
      echo "database is not ready after ${attempts} attempts" >&2
      exit 1
    fi
    sleep "${interval}"
  done

  if [ "${PAYLOAD_RUN_MIGRATIONS:-true}" = "true" ]; then
    pnpm payload migrate
  fi
fi

exec "$@"
