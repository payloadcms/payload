#!/bin/bash
set -e

echo "Setting up replica server..."

# Check if data directory is empty or only has lost+found
if [ -z "$(ls -A /var/lib/postgresql/data 2>/dev/null | grep -v lost+found)" ]; then
    echo "Data directory is empty, initializing replica from primary..."

    # Remove any existing data
    rm -rf /var/lib/postgresql/data/*

    # Wait for primary to be fully ready
    echo "Waiting for primary server to be ready..."
    until PGPASSWORD=replicator_password pg_isready -h postgres-primary -p 5432 -U replicator; do
        echo "Primary not ready yet, waiting..."
        sleep 2
    done

    echo "Primary is ready, starting base backup..."

    # Perform base backup from primary
    PGPASSWORD=replicator_password pg_basebackup \
        -h postgres-primary \
        -p 5432 \
        -U replicator \
        -D /var/lib/postgresql/data \
        -Fp \
        -Xs \
        -P \
        -R

    echo "Base backup completed successfully"

    # Create standby.signal file (for PostgreSQL 12+)
    touch /var/lib/postgresql/data/standby.signal

    # Configure replica-specific settings
    cat >> /var/lib/postgresql/data/postgresql.auto.conf <<EOF
primary_conninfo = 'host=postgres-primary port=5432 user=replicator password=replicator_password'
primary_slot_name = 'replication_slot'
hot_standby = on
EOF

    echo "Replica configuration complete"
else
    echo "Data directory already contains data, skipping initialization"
fi

echo "Replica setup script completed"
