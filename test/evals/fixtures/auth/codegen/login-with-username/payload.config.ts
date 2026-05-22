import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'customers',
      auth: true,
      fields: [
        {
          name: 'username',
          type: 'text',
        },
      ],
    },
  ],
})
