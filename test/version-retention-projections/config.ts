import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { defaultPostgresUrl } from '../dbAdapters.js'
import { RetentionPosts } from './collections/RetentionPosts.js'
import { fields } from './fields.js'
import { seed } from './fixtures.js'
import { globalSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const queries: string[] = []

export default buildConfigWithDefaults({
  config: {
    collections: [RetentionPosts],
    db: postgresAdapter({
      logger: { logQuery: (query) => queries.push(query) },
      pool: {
        connectionString:
          process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl,
      },
    }),
    globals: [
      {
        slug: globalSlug,
        access: { read: () => true, readVersions: () => true, update: () => true },
        fields,
        versions: { drafts: true, max: 2 },
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'de'] },
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  disableMCP: true,
  seed,
  suite: 'version-retention-projections',
})
