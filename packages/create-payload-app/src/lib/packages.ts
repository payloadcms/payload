import type { BundlerType, DbType, EditorType } from '../types.js'

type DbAdapterReplacement = {
  configReplacement: string[]
  importReplacement: string
  packageName: string
  version: string
}

type BundlerReplacement = {
  configReplacement: string
  importReplacement: string
  packageName: string
  version: string
}

type EditorReplacement = {
  configReplacement: string
  importReplacement: string
  packageName: string
  version: string
}

const mongodbReplacement: DbAdapterReplacement = {
  importReplacement: "import { mongooseAdapter } from '@payloadcms/db-mongodb'",
  packageName: '@payloadcms/db-mongodb',
  // Replacement between `// database-adapter-config-start` and `// database-adapter-config-end`
  configReplacement: ['  db: mongooseAdapter({', '    url: process.env.DATABASE_URI,', '  }),'],
  version: '^1.0.0',
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
  version: '^0.x', // up to, not including 1.0.0
}

export const dbPackages: Record<DbType, DbAdapterReplacement> = {
  mongodb: mongodbReplacement,
  postgres: postgresReplacement,
}

const webpackReplacement: BundlerReplacement = {
  importReplacement: "import { webpackBundler } from '@payloadcms/bundler-webpack'",
  packageName: '@payloadcms/bundler-webpack',
  // Replacement of line containing `// bundler-config`
  configReplacement: '    bundler: webpackBundler(),',
  version: '^1.0.0',
}

const viteReplacement: BundlerReplacement = {
  configReplacement: '  bundler: viteBundler(),',
  importReplacement: "import { viteBundler } from '@payloadcms/bundler-vite'",
  packageName: '@payloadcms/bundler-vite',
  version: '^0.x', // up to, not including 1.0.0
}

export const bundlerPackages: Record<BundlerType, BundlerReplacement> = {
  vite: viteReplacement,
  webpack: webpackReplacement,
}

export const editorPackages: Record<EditorType, EditorReplacement> = {
  lexical: {
    configReplacement: '  editor: lexicalEditor({}),',
    importReplacement: "import { lexicalEditor } from '@payloadcms/richtext-lexical'",
    packageName: '@payloadcms/richtext-lexical',
    version: '^0.x', // up to, not including 1.0.0
  },
  slate: {
    configReplacement: '  editor: slateEditor({}),',
    importReplacement: "import { slateEditor } from '@payloadcms/richtext-slate'",
    packageName: '@payloadcms/richtext-slate',
    version: '^1.0.0',
  },
}
