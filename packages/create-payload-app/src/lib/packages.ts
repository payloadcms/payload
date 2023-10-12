import type { BundlerType, DbType, EditorType } from '../types'

type DbAdapterReplacement = {
  packageName: string
  importReplacement: string
  configReplacement: string[]
  version: string
}

type BundlerReplacement = {
  packageName: string
  importReplacement: string
  configReplacement: string
  version: string
}

type EditorReplacement = {
  packageName: string
  importReplacement: string
  configReplacement: string
  version: string
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
  version: '^1.0.0',
}

const postgresReplacement: DbAdapterReplacement = {
  packageName: '@payloadcms/db-postgres',
  importReplacement: "import { postgresAdapter } from '@payloadcms/db-postgres'",
  configReplacement: [
    '  db: postgresAdapter({',
    '    pool: {',
    '      connectionString: process.env.DATABASE_URI,',
    '    },',
    '  }),',
  ],
  version: '^0.x', // up to, not including 1.0.0
}

export const dbPackages: Record<DbType, DbAdapterReplacement> = {
  mongodb: mongodbReplacement,
  postgres: postgresReplacement,
}

const webpackReplacement: BundlerReplacement = {
  packageName: '@payloadcms/bundler-webpack',
  importReplacement: "import { webpackBundler } from '@payloadcms/bundler-webpack'",
  // Replacement of line containing `// bundler-config`
  configReplacement: '    bundler: webpackBundler(),',
  version: '^1.0.0',
}

const viteReplacement: BundlerReplacement = {
  packageName: '@payloadcms/bundler-vite',
  importReplacement: "import { viteBundler } from '@payloadcms/bundler-vite'",
  configReplacement: '  bundler: viteBundler(),',
  version: '^0.x', // up to, not including 1.0.0
}

export const bundlerPackages: Record<BundlerType, BundlerReplacement> = {
  webpack: webpackReplacement,
  vite: viteReplacement,
}

export const editorPackages: Record<EditorType, EditorReplacement> = {
  slate: {
    packageName: '@payloadcms/richtext-slate',
    importReplacement: "import { slateEditor } from '@payloadcms/richtext-slate'",
    configReplacement: '  editor: slateEditor({}),',
    version: '^1.0.0',
  },
  lexical: {
    packageName: '@payloadcms/richtext-lexical',
    importReplacement:
      "import { lexicalEditor } from '@payloadcms/richtext-lexical'",
    configReplacement: '  editor: lexicalEditor({}),',
    version: '^0.x', // up to, not including 1.0.0
  },
}
