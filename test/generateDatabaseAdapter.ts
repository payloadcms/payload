import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Runs on port 27018 to avoid conflicts with locally installed MongoDB
const mongooseAdapterArgs = `
    ensureIndexes: true,
    url:
        process.env.MONGODB_URL || process.env.DATABASE_URL ||
      'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
`

export const defaultPostgresUrl = 'postgres://payload:payload@127.0.0.1:5433/payload'

export const allDatabaseAdapters = {
  mongodb: `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ${mongooseAdapterArgs}
  })`,
  // mongodb-atlas uses Docker-based MongoDB Atlas Local (all-in-one with search)
  // Start with: pnpm docker:mongodb-atlas:start
  // Runs on port 27019 to avoid conflicts with mongodb
  'mongodb-atlas': `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ensureIndexes: true,
    url:
        process.env.MONGODB_ATLAS_URL || process.env.DATABASE_URL ||
      'mongodb://localhost:27019/payload?directConnection=true&replicaSet=mongodb-atlas-local',
  })`,
  cosmosdb: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.cosmosdb,
    ${mongooseAdapterArgs}
  })`,
  documentdb: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.documentdb,
    ${mongooseAdapterArgs}
  })`,
  firestore: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.firestore,
    ${mongooseAdapterArgs}
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
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || '${defaultPostgresUrl}',
    },
  })`,
  'postgres-custom-schema': `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || '${defaultPostgresUrl}',
    },
    schemaName: 'custom',
  })`,
  'postgres-uuid': `
    import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    idType: 'uuid',
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || '${defaultPostgresUrl}',
    },
  })`,
  'postgres-read-replica': `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    },
    readReplicas: [process.env.POSTGRES_REPLICA_URL],
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
  return 'mongodb'
}
