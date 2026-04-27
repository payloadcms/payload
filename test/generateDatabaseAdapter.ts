import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { adapterEndpoints, postgresReplicaEndpoint } from './__helpers/shared/dbProfiles.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Mongo-flavored adapters all hit the docker-compose mongodb service (port
// 27018) but each has its own entry in adapterEndpoints — each adapter
// references its own row so a future divergence (e.g. cosmosdb pointed at a
// different host) only requires editing the map, not the codegen.
type MongoAdapterKey = 'cosmosdb' | 'documentdb' | 'firestore' | 'mongodb'
const mongooseAdapterArgs = (adapter: MongoAdapterKey) => `
    ensureIndexes: true,
    url:
        process.env.${adapterEndpoints[adapter]?.envVar} || process.env.DATABASE_URL ||
      'mongodb://payload:payload@${adapterEndpoints[adapter]?.host}:${adapterEndpoints[adapter]?.port}/payload?authSource=admin&directConnection=true&replicaSet=rs0',
`

// Postgres-flavored adapters likewise share a default URL shape but each
// references its own entry. supabase and vercel-postgres-read-replica are NOT
// in this list — they aren't docker-compose services and use their own conventions.
type PostgresAdapterKey =
  | 'postgres'
  | 'postgres-custom-schema'
  | 'postgres-read-replica'
  | 'postgres-read-replicas'
  | 'postgres-uuid'
  | 'postgres-uuidv7'
const postgresConnectionString = (adapter: PostgresAdapterKey) =>
  `process.env.${adapterEndpoints[adapter]?.envVar} || process.env.DATABASE_URL || 'postgres://payload:payload@${adapterEndpoints[adapter]?.host}:${adapterEndpoints[adapter]?.port}/payload'`

// Exported for external test configs (database/, queues/, select/, …) that
// want a canonical postgres URL without going through the codegen path.
export const defaultPostgresUrl = `postgres://payload:payload@${adapterEndpoints.postgres?.host}:${adapterEndpoints.postgres?.port}/payload`

export const allDatabaseAdapters = {
  mongodb: `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ${mongooseAdapterArgs('mongodb')}
  })`,
  // mongodb-atlas uses Docker-based MongoDB Atlas Local (all-in-one with search)
  // Start with: pnpm docker:start (or --profile mongodb-atlas for just this service)
  // Runs on port 27019 to avoid conflicts with mongodb
  'mongodb-atlas': `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ensureIndexes: true,
    url:
        process.env.${adapterEndpoints['mongodb-atlas']?.envVar} || process.env.DATABASE_URL ||
      'mongodb://${adapterEndpoints['mongodb-atlas']?.host}:${adapterEndpoints['mongodb-atlas']?.port}/payload?directConnection=true&replicaSet=mongodb-atlas-local',
  })`,
  cosmosdb: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.cosmosdb,
    ${mongooseAdapterArgs('cosmosdb')}
  })`,
  documentdb: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.documentdb,
    ${mongooseAdapterArgs('documentdb')}
  })`,
  firestore: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.firestore,
    ${mongooseAdapterArgs('firestore')}
    // The following options prevent some tests from failing.
    // More work needed to get tests succeeding without these options.
    ensureIndexes: true,
    disableIndexHints: false,
    useAlternativeDropDatabase: false,
  })`,
  postgres: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnectionString('postgres')},
    },
  })`,
  'postgres-custom-schema': `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnectionString('postgres-custom-schema')},
    },
    schemaName: 'custom',
  })`,
  'postgres-uuid': `
    import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    idType: 'uuid',
    pool: {
      connectionString: ${postgresConnectionString('postgres-uuid')},
    },
  })`,
  'postgres-uuidv7': `
    import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    idType: 'uuidv7',
    pool: {
      connectionString: ${postgresConnectionString('postgres-uuidv7')},
    },
  })`,
  'postgres-read-replica': `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnectionString('postgres-read-replica')},
    },
    readReplicas: [
      process.env.${postgresReplicaEndpoint.envVar} || 'postgres://payload:payload@${postgresReplicaEndpoint.host}:${postgresReplicaEndpoint.port}/payload',
    ],
  })`,
  'postgres-read-replicas': `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnectionString('postgres-read-replicas')},
    },
    readReplicas: [
      process.env.${postgresReplicaEndpoint.envVar} || 'postgres://payload:payload@${postgresReplicaEndpoint.host}:${postgresReplicaEndpoint.port}/payload',
    ],
  })`,
  'content-api': `
import { contentAPIAdapter } from '@payloadcms/figma'
export const databaseAdapter = contentAPIAdapter({
  auth: {
    mode: 'devJwt',
  },
  url: process.env.CONTENT_API_URL || 'http://localhost:8080',
  contentSystemId: process.env.CONTENT_SYSTEM_ID || '00000000-0000-4000-8000-000000000001',
})
  `,
  'vercel-postgres-read-replica': `
  import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

  export const databaseAdapter = vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    },
    readReplicas: [process.env.POSTGRES_REPLICA_URL],
  })
  `,
  sqlite: `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    },
    autoIncrement: true
  })`,
  'sqlite-uuid': `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    idType: 'uuid',
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    }
  })`,
  'sqlite-uuidv7': `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    idType: 'uuidv7',
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    }
  })`,
  supabase: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString:
        process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
  })`,
  d1: `
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'

export const databaseAdapter = sqliteD1Adapter({ binding: global.d1 })
  `,
}

/**
 * Write to databaseAdapter.ts
 */
export function generateDatabaseAdapter(dbAdapter: keyof typeof allDatabaseAdapters) {
  const databaseAdapter = allDatabaseAdapters[dbAdapter]
  if (!databaseAdapter) {
    throw new Error(`Unknown database adapter: ${dbAdapter}`)
  }
  fs.writeFileSync(
    path.resolve(dirname, 'databaseAdapter.js'),
    `
  // DO NOT MODIFY. This file is automatically generated by the test suite.

  ${databaseAdapter}
  `,
  )

  console.log('Wrote', dbAdapter, 'db adapter')
  return databaseAdapter
}

export type DatabaseAdapterType = keyof typeof allDatabaseAdapters

export const getCurrentDatabaseAdapter = (): DatabaseAdapterType => {
  const dbAdapter = process.env.PAYLOAD_DATABASE as DatabaseAdapterType | undefined
  if (dbAdapter && Object.keys(allDatabaseAdapters).includes(dbAdapter)) {
    return dbAdapter
  }

  return 'sqlite'
}
