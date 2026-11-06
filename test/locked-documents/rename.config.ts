import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { defaultPostgresUrl } from '../dbAdapters.js'
import { PlainMedia } from '../file-versioning/collections/PlainMedia/index.js'

export const renameMediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'rename-media',
)

export default buildConfigWithDefaults({
  suite: 'locked-documents-rename',
  config: {
    collections: [{ ...PlainMedia, upload: { staticDir: renameMediaDir } }],
    db: postgresAdapter({
      pool: {
        connectionString: process.env.POSTGRES_URL || defaultPostgresUrl,
        connectionTimeoutMillis: 1000,
        max: 1,
      },
    }),
  },
})
