#!/bin/bash
set -e

echo "Configuring primary server for replication..."

# Create replication user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create replication user if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
            CREATE ROLE replicator WITH REPLICATION PASSWORD 'replicator_password' LOGIN;
        END IF;
    END
    \$\$;

    -- Grant necessary permissions
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO replicator;
EOSQL

# Create replication slot if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replication_slot')
        THEN 'Replication slot already exists'
        ELSE (SELECT pg_create_physical_replication_slot('replication_slot'))::text
    END;
EOSQL

# Configure pg_hba.conf for replication if not already configured
if ! grep -q "host replication replicator" "$PGDATA/pg_hba.conf"; then
    echo "host replication replicator all md5" >> "$PGDATA/pg_hba.conf"
    echo "host all all all md5" >> "$PGDATA/pg_hba.conf"
fi

echo "Primary server configuration complete"
