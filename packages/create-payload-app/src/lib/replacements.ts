import type { DbType, StorageAdapterType } from '../types.js'

type DbAdapterReplacement = {
  configReplacement: (envName?: string) => string[]
  importReplacement: string
  packageName: string
}

const mongodbReplacement: DbAdapterReplacement = {
  // Replacement between `// database-adapter-config-start` and `// database-adapter-config-end`
  configReplacement: (envName = 'DATABASE_URI') => [
    '  db: mongooseAdapter({',
    `    url: process.env.${envName} || '',`,
    '  }),',
  ],
  importReplacement: "import { mongooseAdapter } from '@payloadcms/db-mongodb'",
  packageName: '@payloadcms/db-mongodb',
}

const postgresReplacement: DbAdapterReplacement = {
  configReplacement: (envName = 'DATABASE_URI') => [
    '  db: postgresAdapter({',
    '    pool: {',
    `      connectionString: process.env.${envName} || '',`,
    '    },',
    '  }),',
  ],
  importReplacement: "import { postgresAdapter } from '@payloadcms/db-postgres'",
  packageName: '@payloadcms/db-postgres',
}

const vercelPostgresReplacement: DbAdapterReplacement = {
  configReplacement: (envName = 'POSTGRES_URL') => [
    '  db: vercelPostgresAdapter({',
    '    pool: {',
    `      connectionString: process.env.${envName} || '',`,
    '    },',
    '  }),',
  ],
  importReplacement: "import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'",
  packageName: '@payloadcms/db-vercel-postgres',
}

const sqliteReplacement: DbAdapterReplacement = {
  configReplacement: (envName = 'DATABASE_URI') => [
    '  db: sqliteAdapter({',
    '    client: {',
    `      url: process.env.${envName} || '',`,
    '    },',
    '  }),',
  ],
  importReplacement: "import { sqliteAdapter } from '@payloadcms/db-sqlite'",
  packageName: '@payloadcms/db-sqlite',
}

export const dbReplacements: Record<DbType, DbAdapterReplacement> = {
  mongodb: mongodbReplacement,
  postgres: postgresReplacement,
  sqlite: sqliteReplacement,
  'vercel-postgres': vercelPostgresReplacement,
}

type StorageAdapterReplacement = {
  configReplacement: string[]
  importReplacement?: string
  packageName?: string
}

const vercelBlobStorageReplacement: StorageAdapterReplacement = {
  // Replacement of `// storage-adapter-placeholder`
  configReplacement: [
    '    vercelBlobStorage({',
    '      collections: {',
    '        media: true,',
    '      },',
    "      token: process.env.BLOB_READ_WRITE_TOKEN || '',",
    '    }),',
  ],
  importReplacement: "import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'",
  packageName: '@payloadcms/storage-vercel-blob',
}

const payloadCloudReplacement: StorageAdapterReplacement = {
  configReplacement: ['    payloadCloudPlugin(),'],
  importReplacement: "import { payloadCloudPlugin } from '@payloadcms/payload-cloud'",
  packageName: '@payloadcms/payload-cloud',
}

// Removes placeholders
const diskReplacement: StorageAdapterReplacement = {
  configReplacement: [],
  importReplacement: '',
}

export const storageReplacements: Record<StorageAdapterType, StorageAdapterReplacement> = {
  localDisk: diskReplacement,
  payloadCloud: payloadCloudReplacement,
  vercelBlobStorage: vercelBlobStorageReplacement,
}

/**
 * Generic config replacement
 */
type ConfigReplacement = {
  configReplacement: {
    match: string
    replacement: string
  }
  importReplacement: string
  packageName: string
}

export const configReplacements: Record<string, ConfigReplacement> = {
  sharp: {
    // Replacement of `sharp, // Now optional`
    configReplacement: {
      match: 'sharp,',
      replacement: '  // sharp,',
    },
    importReplacement: "import sharp from 'sharp'",
    packageName: 'sharp',
  },
}
