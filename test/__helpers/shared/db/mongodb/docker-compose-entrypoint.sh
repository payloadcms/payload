#!/bin/bash
# MongoDB Community entrypoint - initializes replica set and users
#
# Why only MongoDB needs this (not Postgres or Atlas Local):
#   - Replica set must be initialized AFTER mongod starts
#   - Users must be created AFTER replica set is primary
#   - Can't enable auth until users exist (chicken-and-egg)
#   - Keyfile needs chmod 400 at runtime
#
# Sequence: start without auth → init replica set → create users → restart with auth
# Subsequent starts skip init (checks .initialized flag)
set -e

DATA_DIR="/data/db"
KEYFILE_SRC="/etc/mongodb/keyfile"
KEYFILE="/data/db/keyfile"
INIT_FLAG="$DATA_DIR/.initialized"

# Copy keyfile to writable location and set correct permissions
cp "$KEYFILE_SRC" "$KEYFILE"
chmod 400 "$KEYFILE"
chown mongodb:mongodb "$KEYFILE" 2>/dev/null || true

# Check if already initialized
if [ -f "$INIT_FLAG" ]; then
    echo "MongoDB already initialized, starting with auth..."
    exec mongod --replSet rs0 --bind_ip_all --keyFile "$KEYFILE" \
        --setParameter searchIndexManagementHostAndPort=mongot:27028 \
        --setParameter mongotHost=mongot:27028
fi

echo "First run - initializing MongoDB without auth..."

# Start MongoDB without auth in background
mongod --replSet rs0 --bind_ip_all \
    --setParameter searchIndexManagementHostAndPort=mongot:27028 \
    --setParameter mongotHost=mongot:27028 \
    --setParameter useGrpcForSearch=true \
    --setParameter skipAuthenticationToSearchIndexManagementServer=false &
MONGOD_PID=$!

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
for i in {1..30}; do
    if mongosh --eval "db.adminCommand('ping')" 2>/dev/null; then
        echo "MongoDB started"
        break
    fi
    sleep 0.5
done

# Initialize replica set with hostname accessible from other containers
echo "Initializing replica set..."
mongosh --eval '
    try {
        rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongodb:27017" }] });
        print("Replica set initiated");
    } catch(e) {
        print("RS init: " + e.message);
    }
'

# Wait for primary
echo "Waiting for primary..."
for i in {1..30}; do
    if mongosh --eval 'rs.isMaster().ismaster' 2>/dev/null | grep -q true; then
        echo "Primary ready"
        break
    fi
    sleep 0.5
done

# Create users
echo "Creating users..."
mongosh --eval '
    // Create admin user
    try {
        db.getSiblingDB("admin").createUser({
            user: "admin",
            pwd: "adminPassword",
            roles: ["root"]
        });
        print("Created admin user");
    } catch(e) {
        print("Admin: " + e.message);
    }

    // Create mongot user with searchCoordinator role
    try {
        db.getSiblingDB("admin").createUser({
            user: "mongotUser",
            pwd: "mongotPassword",
            roles: [{ role: "searchCoordinator", db: "admin" }]
        });
        print("Created mongotUser");
    } catch(e) {
        print("mongotUser: " + e.message);
    }

    // Create payload user for application
    try {
        db.getSiblingDB("admin").createUser({
            user: "payload",
            pwd: "payload",
            roles: ["root"]
        });
        print("Created payload user");
    } catch(e) {
        print("payload: " + e.message);
    }
'

# Stop MongoDB
echo "Stopping MongoDB to restart with auth..."
kill $MONGOD_PID
wait $MONGOD_PID 2>/dev/null || true

# Mark as initialized
touch "$INIT_FLAG"

echo "Starting MongoDB with auth enabled..."
exec mongod --replSet rs0 --bind_ip_all --keyFile "$KEYFILE" \
    --setParameter searchIndexManagementHostAndPort=mongot:27028 \
    --setParameter mongotHost=mongot:27028 \
    --setParameter useGrpcForSearch=true \
    --setParameter skipAuthenticationToSearchIndexManagementServer=false

