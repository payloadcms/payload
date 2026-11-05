#!/bin/bash
# Entrypoint for the replica container.
# Waits for primary, clones it with pg_basebackup, then starts postgres.
set -e

PRIMARY_HOST="${PRIMARY_HOST:-postgres}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
PRIMARY_USER="${PRIMARY_USER:-payload}"
PRIMARY_PASSWORD="${PRIMARY_PASSWORD:-payload}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"

echo "Waiting for primary at $PRIMARY_HOST:$PRIMARY_PORT..."
until PGPASSWORD="$PRIMARY_PASSWORD" pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U "$PRIMARY_USER"; do
  sleep 1
done
echo "Primary is ready."

if [ -z "$(ls -A "$PGDATA")" ]; then
  echo "Running pg_basebackup to seed replica..."
  PGPASSWORD="$PRIMARY_PASSWORD" pg_basebackup \
    -h "$PRIMARY_HOST" \
    -p "$PRIMARY_PORT" \
    -U "$PRIMARY_USER" \
    -D "$PGDATA" \
    --wal-method=stream \
    --checkpoint=fast \
    --progress \
    --verbose

  # Tell postgres to stream from primary
  cat >> "$PGDATA/postgresql.auto.conf" <<EOF
primary_conninfo = 'host=$PRIMARY_HOST port=$PRIMARY_PORT user=$PRIMARY_USER password=$PRIMARY_PASSWORD'
hot_standby = on
EOF

  # Mark this as a standby (replaces recovery.conf in PG12+)
  touch "$PGDATA/standby.signal"

  # Fix permissions (pg_basebackup may leave them wrong)
  chmod 0700 "$PGDATA"
fi

echo "Starting replica postgres..."
exec docker-entrypoint.sh postgres \
  -c hot_standby=on \
  -c wal_level=replica
