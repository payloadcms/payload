type DbEndpoint = {
  /** Connection-string env var checked before the default URL. */
  envVar: string
  host: string
  /** User-facing display name for error messages. */
  label: string
  port: number
  /** docker-compose service profile, used in `pnpm docker:start <profile>` hints. */
  profile: 'mongodb' | 'mongodb-atlas' | 'postgres'
}

export const adapterEndpoints: Record<string, DbEndpoint | null> = {
  mongodb: {
    envVar: 'MONGODB_URL',
    host: 'localhost',
    port: 27018,
    label: 'MongoDB',
    profile: 'mongodb',
  },
  cosmosdb: {
    envVar: 'MONGODB_URL',
    host: 'localhost',
    port: 27018,
    label: 'MongoDB',
    profile: 'mongodb',
  },
  documentdb: {
    envVar: 'MONGODB_URL',
    host: 'localhost',
    port: 27018,
    label: 'MongoDB',
    profile: 'mongodb',
  },
  firestore: {
    envVar: 'MONGODB_URL',
    host: 'localhost',
    port: 27018,
    label: 'MongoDB',
    profile: 'mongodb',
  },
  'mongodb-atlas': {
    envVar: 'MONGODB_ATLAS_URL',
    host: 'localhost',
    port: 27019,
    label: 'MongoDB Atlas Local',
    profile: 'mongodb-atlas',
  },
  postgres: {
    envVar: 'POSTGRES_URL',
    host: 'localhost',
    port: 5433,
    label: 'PostgreSQL',
    profile: 'postgres',
  },
  'postgres-custom-schema': {
    envVar: 'POSTGRES_URL',
    host: 'localhost',
    port: 5433,
    label: 'PostgreSQL',
    profile: 'postgres',
  },
  'postgres-uuid': {
    envVar: 'POSTGRES_URL',
    host: 'localhost',
    port: 5433,
    label: 'PostgreSQL',
    profile: 'postgres',
  },
  'postgres-uuidv7': {
    envVar: 'POSTGRES_URL',
    host: 'localhost',
    port: 5433,
    label: 'PostgreSQL',
    profile: 'postgres',
  },
  'postgres-read-replica': {
    envVar: 'POSTGRES_URL',
    host: 'localhost',
    port: 5433,
    label: 'PostgreSQL',
    profile: 'postgres',
  },
  'postgres-read-replicas': {
    envVar: 'POSTGRES_URL',
    host: 'localhost',
    port: 5433,
    label: 'PostgreSQL',
    profile: 'postgres',
  },
  sqlite: null,
  'sqlite-uuid': null,
  'sqlite-uuidv7': null,
  supabase: null,
  d1: null,
  'content-api': null,
  'vercel-postgres-read-replica': null,
}

export const postgresReplicaEndpoint = {
  envVar: 'POSTGRES_REPLICA_URL',
  host: 'localhost',
  port: 5434,
} as const
