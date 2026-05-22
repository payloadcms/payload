import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// BUG: This config intends to disable counting overhead for the admin list
// view, but `pagination: false` combined with no explicit limit means every
// request will load ALL documents from the collection — potentially thousands.
export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      admin: {
        // This is dangerous: loads every document on every admin list-view request
        pagination: {
          defaultLimit: 0,
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
})
