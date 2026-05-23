import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    push: false,
  }),
  secret: 'eval-fixture',
})
