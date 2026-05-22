import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [],
  globals: [
    {
      slug: 'header',
      fields: [
        {
          name: 'siteName',
          type: 'text',
        },
        {
          name: 'updatedAt',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
  ],
})
