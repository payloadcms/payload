import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

import { defaultPostgresUrl } from '../generateDatabaseAdapter.js'

export default buildConfig({
  secret: '__',
  db: postgresAdapter({
    logger: true,
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl,
    },
  }),
  collections: [
    {
      slug: 'relation',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'relation',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'relation',
                },
                {
                  name: 'manyRelations',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'relation',
                  hasMany: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
