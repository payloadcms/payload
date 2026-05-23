import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
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
  db: stubAdapter,
  secret: 'eval-fixture',
})
