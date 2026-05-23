import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'isBanned',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
