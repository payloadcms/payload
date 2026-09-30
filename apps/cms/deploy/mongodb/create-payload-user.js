// Creates (or updates the password of) the MongoDB user Payload connects with.
// Run it ON THE MONGODB EC2 as an admin user:
//
//   PAYLOAD_DB_PASSWORD='a-strong-password' mongosh -u <admin-user> -p --authenticationDatabase admin \
//     create-payload-user.js
//
// Optional env vars: PAYLOAD_DB_NAME (default "payload"), PAYLOAD_DB_USER (default "payload").
// The user is stored in the `admin` database, so the connection string needs ?authSource=admin.
const databaseName = process.env.PAYLOAD_DB_NAME || 'payload'
const username = process.env.PAYLOAD_DB_USER || 'payload'
const password = process.env.PAYLOAD_DB_PASSWORD

if (!password) {
  throw new Error('Set PAYLOAD_DB_PASSWORD to the password for the Payload database user.')
}

const adminDb = db.getSiblingDB('admin')
const roles = [{ db: databaseName, role: 'readWrite' }]

if (adminDb.getUser(username)) {
  adminDb.updateUser(username, { pwd: password, roles })
  print(`Updated user "${username}" with readWrite on "${databaseName}".`)
} else {
  adminDb.createUser({ pwd: password, roles, user: username })
  print(`Created user "${username}" with readWrite on "${databaseName}".`)
}

print(
  `DATABASE_URL=mongodb://${username}:<url-encoded-password>@<this-server-private-ip>:27017/${databaseName}?authSource=admin`,
)
