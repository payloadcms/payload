import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { defaultPostgresUrl } from '../../dbAdapters.js'
import { SimpleCollection } from '../collections/Simple/index.js'
import { Users } from '../collections/Users/index.js'

export default buildConfigWithDefaults({
  suite: 'locked-documents-vercel-postgres',
  config: {
    collections: [SimpleCollection, Users],
    db: vercelPostgresAdapter({
      pool: {
        connectionString:
          process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl,
        connectionTimeoutMillis: 2000,
        max: 2,
      },
    }),
    typescript: { autoGenerate: false },
  },
})
