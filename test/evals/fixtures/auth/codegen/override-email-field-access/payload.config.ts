import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'role',
          type: 'select',
          defaultValue: 'user',
          options: ['admin', 'user'],
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
