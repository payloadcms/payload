import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'products',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
      versions: false,
    },
  ],
})
