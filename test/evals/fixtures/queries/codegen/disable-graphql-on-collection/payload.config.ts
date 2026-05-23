import { stubAdapter } from '@/db-stub.js'
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
    {
      slug: 'audit-log',
      fields: [
        {
          name: 'action',
          type: 'text',
        },
        {
          name: 'docId',
          type: 'text',
        },
        {
          name: 'performedAt',
          type: 'date',
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
