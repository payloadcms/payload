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
        {
          name: 'status',
          type: 'select',
          defaultValue: 'draft',
          options: ['draft', 'published'],
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
