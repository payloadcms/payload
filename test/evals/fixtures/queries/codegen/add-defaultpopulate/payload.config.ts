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
          name: 'slug',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
        },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      slug: 'media',
      fields: [],
      upload: true,
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
