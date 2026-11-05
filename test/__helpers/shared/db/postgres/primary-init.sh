#!/bin/bash
# Runs inside the primary container during docker-entrypoint-initdb.d phase.
# Grants replication privilege to the payload user and allows replica connections.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  ALTER USER payload REPLICATION;
EOSQL

# Allow replication connections from any host (test environment only)
echo "host replication payload all md5" >> "$PGDATA/pg_hba.conf"
