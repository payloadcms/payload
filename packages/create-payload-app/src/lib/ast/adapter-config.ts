/**
 * Centralized adapter configuration
 * Shared across all AST transformation and test files
 */

import type { DatabaseAdapter, StorageAdapter } from './types.js'

export type DatabaseAdapterConfig = {
  adapterName: string
  configTemplate: (envVar: string) => string
  packageName: string
}

export type StorageAdapterConfig = {
  adapterName: null | string
  configTemplate: () => null | string
  packageName: null | string
}

/**
 * Database adapter configurations
 */
export const DB_ADAPTER_CONFIG: Record<DatabaseAdapter, DatabaseAdapterConfig> = {
  'd1-sqlite': {
    adapterName: 'sqliteD1Adapter',
    configTemplate: () => `sqliteD1Adapter({
  binding: cloudflare.env.D1,
})`,
    packageName: '@payloadcms/db-d1-sqlite',
  },
  mongodb: {
    adapterName: 'mongooseAdapter',
    configTemplate: (envVar: string) => `mongooseAdapter({
  url: process.env.${envVar} || '',
})`,
    packageName: '@payloadcms/db-mongodb',
  },
  postgres: {
    adapterName: 'postgresAdapter',
    configTemplate: (envVar: string) => `postgresAdapter({
  pool: {
    connectionString: process.env.${envVar} || '',
  },
})`,
    packageName: '@payloadcms/db-postgres',
  },
  sqlite: {
    adapterName: 'sqliteAdapter',
    configTemplate: () => `sqliteAdapter({
  client: {
    url: process.env.DATABASE_URL || '',
  },
})`,
    packageName: '@payloadcms/db-sqlite',
  },
  'vercel-postgres': {
    adapterName: 'vercelPostgresAdapter',
    configTemplate: () => `vercelPostgresAdapter({
  pool: {
    connectionString: process.env.POSTGRES_URL || '',
  },
})`,
    packageName: '@payloadcms/db-vercel-postgres',
  },
} as const

/**
 * Storage adapter configurations
 */
export const STORAGE_ADAPTER_CONFIG: Record<StorageAdapter, StorageAdapterConfig> = {
  azureStorage: {
    adapterName: 'azureStorage',
    configTemplate: () => `azureStorage({
    collections: {
      media: true,
    },
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || '',
  })`,
    packageName: '@payloadcms/storage-azure',
  },
  gcsStorage: {
    adapterName: 'gcsStorage',
    configTemplate: () => `gcsStorage({
    collections: {
      media: true,
    },
    bucket: process.env.GCS_BUCKET || '',
  })`,
    packageName: '@payloadcms/storage-gcs',
  },
  localDisk: {
    adapterName: null,
    configTemplate: () => null,
    packageName: null,
  },
  r2Storage: {
    adapterName: 'r2Storage',
    configTemplate: () => `r2Storage({
    bucket: cloudflare.env.R2,
    collections: { media: true },
  })`,
    packageName: '@payloadcms/storage-r2',
  },
  s3Storage: {
    adapterName: 's3Storage',
    configTemplate: () => `s3Storage({
    collections: {
      media: true,
    },
    bucket: process.env.S3_BUCKET || '',
    config: {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      region: process.env.S3_REGION || '',
    },
  })`,
    packageName: '@payloadcms/storage-s3',
  },
  uploadthingStorage: {
    adapterName: 'uploadthingStorage',
    configTemplate: () => `uploadthingStorage({
    collections: {
      media: true,
    },
    token: process.env.UPLOADTHING_SECRET || '',
  })`,
    packageName: '@payloadcms/storage-uploadthing',
  },
  vercelBlobStorage: {
    adapterName: 'vercelBlobStorage',
    configTemplate: () => `vercelBlobStorage({
    collections: {
      media: true,
    },
    token: process.env.BLOB_READ_WRITE_TOKEN || '',
  })`,
    packageName: '@payloadcms/storage-vercel-blob',
  },
} as const

/**
 * Helper to get database adapter package name
 */
export function getDbPackageName(adapter: DatabaseAdapter): string {
  return DB_ADAPTER_CONFIG[adapter].packageName
}

/**
 * Helper to get database adapter name
 */
export function getDbAdapterName(adapter: DatabaseAdapter): string {
  return DB_ADAPTER_CONFIG[adapter].adapterName
}

/**
 * Helper to get storage adapter package name
 */
export function getStoragePackageName(adapter: StorageAdapter): null | string {
  return STORAGE_ADAPTER_CONFIG[adapter].packageName
}

/**
 * Helper to get storage adapter name
 */
export function getStorageAdapterName(adapter: StorageAdapter): null | string {
  return STORAGE_ADAPTER_CONFIG[adapter].adapterName
}
