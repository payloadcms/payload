import type { DbType } from '../types.js'

type DbAdapterReplacement = {
  configReplacement: string[]
  importReplacement: string
  packageName: string
}

const mongodbReplacement: DbAdapterReplacement = {
  importReplacement: "import { mongooseAdapter } from '@payloadcms/db-mongodb'",
  packageName: '@payloadcms/db-mongodb',
  // Replacement between `// database-adapter-config-start` and `// database-adapter-config-end`
  configReplacement: ['  db: mongooseAdapter({', '    url: process.env.DATABASE_URI,', '  }),'],
}

const postgresReplacement: DbAdapterReplacement = {
  configReplacement: [
    '  db: postgresAdapter({',
    '    pool: {',
    '      connectionString: process.env.DATABASE_URI,',
    '    },',
    '  }),',
  ],
  importReplacement: "import { postgresAdapter } from '@payloadcms/db-postgres'",
  packageName: '@payloadcms/db-postgres',
}

export const dbReplacements: Record<DbType, DbAdapterReplacement> = {
  mongodb: mongodbReplacement,
  postgres: postgresReplacement,
}
