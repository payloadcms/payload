/**
 * Test script to verify MongoDB Atlas Local connection and vector search functionality
 *
 * Usage:
 *   pnpm tsx test/helpers/shared/db/mongodb-atlas/test-connection.ts
 */

import { testConnection } from '../mongodb/test-connection.js'

await testConnection(
  process.env.MONGODB_ATLAS_URL ||
    'mongodb://localhost:27019/payload?directConnection=true&replicaSet=mongodb-atlas-local',
)
