import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type DbAdapter = {
  /** Connection-string env var checked before the default URL. */
  envVar?: string
  /** TCP host. Presence (with `port`) ⇒ assertDbReachable probes the adapter. */
  host?: string
  /** Display label for error messages. */
  label?: string
  /** TCP port. Presence (with `host`) ⇒ assertDbReachable probes the adapter. */
  port?: number
  /** docker-compose service profile for `pnpm docker:start <profile>`. */
  profile?: 'mongodb' | 'mongodb-atlas' | 'postgres'
  /** Adapter source written into databaseAdapter.js by codegen. */
  source: string
}

const MONGO = {
  envVar: 'MONGODB_URL',
  host: 'localhost',
  port: 27018,
  label: 'MongoDB',
  profile: 'mongodb',
} as const
const MONGO_ATLAS = {
  envVar: 'MONGODB_ATLAS_URL',
  host: 'localhost',
  port: 27019,
  label: 'MongoDB Atlas Local',
  profile: 'mongodb-atlas',
} as const
const POSTGRES = {
  envVar: 'POSTGRES_URL',
  host: 'localhost',
  port: 5433,
  label: 'PostgreSQL',
  profile: 'postgres',
} as const
const POSTGRES_REPLICA = {
  envVar: 'POSTGRES_REPLICA_URL',
  host: 'localhost',
  port: 5434,
} as const

const mongoUrlBlock = (e: { envVar: string; host: string; port: number }) => `
    ensureIndexes: true,
    url:
        process.env.${e.envVar} || process.env.DATABASE_URL ||
      'mongodb://payload:payload@${e.host}:${e.port}/payload?authSource=admin&directConnection=true&replicaSet=rs0',
`

const postgresConnString = (e: { envVar: string; host: string; port: number }) =>
  `process.env.${e.envVar} || process.env.DATABASE_URL || 'postgres://payload:payload@${e.host}:${e.port}/payload'`

/** Used by codegen below and by assertDbReachable.ts (presence of `port` ⇒ probe). */
export const dbAdapters = {
  mongodb: {
    ...MONGO,
    source: `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ${mongoUrlBlock(MONGO)}
  })`,
  },
  // mongodb-atlas uses Docker-based MongoDB Atlas Local (all-in-one with search)
  // Start with: pnpm docker:start (or --profile mongodb-atlas for just this service)
  // Runs on port 27019 to avoid conflicts with mongodb
  'mongodb-atlas': {
    ...MONGO_ATLAS,
    source: `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ensureIndexes: true,
    url:
        process.env.${MONGO_ATLAS.envVar} || process.env.DATABASE_URL ||
      'mongodb://${MONGO_ATLAS.host}:${MONGO_ATLAS.port}/payload?directConnection=true&replicaSet=mongodb-atlas-local',
  })`,
  },
  cosmosdb: {
    ...MONGO,
    source: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.cosmosdb,
    ${mongoUrlBlock(MONGO)}
  })`,
  },
  documentdb: {
    ...MONGO,
    source: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.documentdb,
    ${mongoUrlBlock(MONGO)}
  })`,
  },
  firestore: {
    ...MONGO,
    source: `
  import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    ...compatibilityOptions.firestore,
    ${mongoUrlBlock(MONGO)}
    // The following options prevent some tests from failing.
    // More work needed to get tests succeeding without these options.
    ensureIndexes: true,
    disableIndexHints: false,
    useAlternativeDropDatabase: false,
  })`,
  },
  postgres: {
    ...POSTGRES,
    source: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnString(POSTGRES)},
    },
  })`,
  },
  'postgres-custom-schema': {
    ...POSTGRES,
    source: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnString(POSTGRES)},
    },
    schemaName: 'custom',
  })`,
  },
  'postgres-uuid': {
    ...POSTGRES,
    source: `
    import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    idType: 'uuid',
    pool: {
      connectionString: ${postgresConnString(POSTGRES)},
    },
  })`,
  },
  'postgres-uuidv7': {
    ...POSTGRES,
    source: `
    import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    idType: 'uuidv7',
    pool: {
      connectionString: ${postgresConnString(POSTGRES)},
    },
  })`,
  },
  'postgres-read-replica': {
    ...POSTGRES,
    source: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnString(POSTGRES)},
    },
    readReplicas: [
      process.env.${POSTGRES_REPLICA.envVar} || 'postgres://payload:payload@${POSTGRES_REPLICA.host}:${POSTGRES_REPLICA.port}/payload',
    ],
  })`,
  },
  'postgres-read-replicas': {
    ...POSTGRES,
    source: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: ${postgresConnString(POSTGRES)},
    },
    readReplicas: [
      process.env.${POSTGRES_REPLICA.envVar} || 'postgres://payload:payload@${POSTGRES_REPLICA.host}:${POSTGRES_REPLICA.port}/payload',
    ],
  })`,
  },
  'content-api': {
    envVar: 'CONTENT_API_URL',
    source: `
import { contentAPIAdapter } from '@payloadcms/figma'
export const databaseAdapter = contentAPIAdapter({
  auth: {
    mode: 'devJwt',
  },
  url: process.env.CONTENT_API_URL || 'http://localhost:8080',
  contentSystemId: process.env.CONTENT_SYSTEM_ID || '00000000-0000-4000-8000-000000000001',
})
  `,
  },
  'vercel-postgres-read-replica': {
    envVar: 'POSTGRES_URL',
    source: `
  import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

  export const databaseAdapter = vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    },
    readReplicas: [process.env.POSTGRES_REPLICA_URL],
  })
  `,
  },
  sqlite: {
    envVar: 'SQLITE_URL',
    source: `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    },
    autoIncrement: true
  })`,
  },
  'sqlite-uuid': {
    envVar: 'SQLITE_URL',
    source: `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    idType: 'uuid',
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    }
  })`,
  },
  'sqlite-uuidv7': {
    envVar: 'SQLITE_URL',
    source: `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    idType: 'uuidv7',
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    }
  })`,
  },
  supabase: {
    envVar: 'POSTGRES_URL',
    source: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString:
        process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
  })`,
  },
  d1: {
    // d1 uses Cloudflare workerd's `binding` rather than a connection string,
    // so there's no env var to override.
    source: `
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'

export const databaseAdapter = sqliteD1Adapter({ binding: global.d1 })
  `,
  },
} as const satisfies Record<string, DbAdapter>

export type DatabaseAdapterType = keyof typeof dbAdapters

export const defaultPostgresUrl = `postgres://payload:payload@${POSTGRES.host}:${POSTGRES.port}/payload`

/**
 * Write the chosen adapter's source to test/databaseAdapter.js.
 */
export function generateDatabaseAdapter(dbAdapter: DatabaseAdapterType) {
  const adapter = dbAdapters[dbAdapter]
  if (!adapter) {
    throw new Error(`Unknown database adapter: ${dbAdapter}`)
  }
  fs.writeFileSync(
    path.resolve(dirname, 'databaseAdapter.js'),
    `
  // DO NOT MODIFY. This file is automatically generated by the test suite.

  ${adapter.source}
  `,
  )

  console.log('Wrote', dbAdapter, 'db adapter')
  return adapter.source
}

export const getCurrentDatabaseAdapter = (): DatabaseAdapterType => {
  const dbAdapter = process.env.PAYLOAD_DATABASE as DatabaseAdapterType | undefined
  if (dbAdapter && Object.keys(dbAdapters).includes(dbAdapter)) {
    return dbAdapter
  }

  // Default to mongodb, as our e2e tests currently do
  // not pass on sqlite/postgres
  return 'mongodb'
}
