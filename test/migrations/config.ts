import { sqliteAdapter } from '@payloadcms/db-sqlite'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  config: {
    ...(process.env.PAYLOAD_DATABASE === 'sqlite'
      ? {
          db: sqliteAdapter({
            client: {
              url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
            },
            transactionOptions: {},
          }),
        }
      : {}),
    collections: [
      {
        slug: 'posts',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
    ],
  },
  suite: 'migrations',
})
