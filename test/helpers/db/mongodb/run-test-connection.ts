/**
 * Test script to verify MongoDB connection, replica set, and transaction functionality
 *
 * Usage:
 *   pnpm tsx test/helpers/db/mongodb/run-test-connection.ts
 */

import { testConnection } from './test-connection.js'

await testConnection(
  process.env.MONGODB_URL ||
    'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
)
