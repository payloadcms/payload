import type { BundlerType, DbType } from '../types'

type DbAdapterReplacement = {
  packageName: string
  importReplacement: string
  configReplacement: string[]
}

type BundlerReplacement = {
  packageName: string
  importReplacement: string
  configReplacement: string
}

const mongodbReplacement: DbAdapterReplacement = {
  packageName: '@payloadcms/db-mongodb',
  importReplacement: "import { mongooseAdapter } from '@payloadcms/db-mongodb'",
  // Replacement between `// database-adapter-config-start` and `// database-adapter-config-end`
  configReplacement: [
    '  db: mongooseAdapter({',
    '    url: process.env.DATABASE_URI,',
    '  }),',
  ],
}

const postgresReplacement: DbAdapterReplacement = {
  packageName: '@payloadcms/db-postgres',
  importReplacement: "import { postgresAdapter } from '@payloadcms/db-postgres'",
  configReplacement: [
    '  db: postgresAdapter({',
    '    client: {',
    '      connectionString: process.env.DATABASE_URI,',
    '    },',
    '  }),',
  ],
}

export const dbPackages: Record<DbType, DbAdapterReplacement> = {
  mongodb: mongodbReplacement,
  postgres: postgresReplacement,
}

const webpackReplacement: BundlerReplacement = {
  packageName: '@payloadcms/bundler-webpack',
  importReplacement: "import { webpackBundler } from '@payloadcms/bundler-webpack'",
  // Replacement of line containing `// bundler-config`
  configReplacement: '  bundler: webpackBundler(),',
}

const viteReplacement: BundlerReplacement = {
  packageName: '@payloadcms/bundler-vite',
  importReplacement: "import { viteBundler } from '@payloadcms/bundler-vite'",
  configReplacement: '  bundler: viteBundler(),',
}

export const bundlerPackages: Record<BundlerType, BundlerReplacement> = {
  webpack: webpackReplacement,
  vite: viteReplacement,
}
