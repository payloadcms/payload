import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  db: stubAdapter,
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
  secret: 'eval-fixture',
})
