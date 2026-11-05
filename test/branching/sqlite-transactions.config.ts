import { sqliteAdapter } from '@payloadcms/db-sqlite'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { postsSlug } from './shared.js'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [
      {
        slug: postsSlug,
        fields: [{ name: 'title', type: 'text', required: true }],
        versions: true,
      },
    ],
    db: sqliteAdapter({
      client: { url: process.env.SQLITE_URL! },
      transactionOptions: {},
    }),
    typescript: { autoGenerate: false },
  },
  disableMCP: true,
  suite: 'branching-sqlite-transactions',
})
