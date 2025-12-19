/**
 * Test script to verify MongoDB Atlas Local connection and vector search functionality
 *
 * Usage:
 *   pnpm tsx test/helpers/db/mongodb-atlas/test-connection.ts
 */

import { testConnection } from './test-connection.js'

await testConnection(
  process.env.MONGODB_URL ||
    'mongodb://payload:payload@localhost:27017/payload?authSource=admin&directConnection=true',
)
