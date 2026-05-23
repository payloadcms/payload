import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'news',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
        },
        {
          name: 'publishedAt',
          type: 'date',
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
