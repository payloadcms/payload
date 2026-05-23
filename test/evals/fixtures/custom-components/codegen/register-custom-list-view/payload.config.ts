import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      admin: {
        components: {
          views: {},
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: ['draft', 'published'],
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
