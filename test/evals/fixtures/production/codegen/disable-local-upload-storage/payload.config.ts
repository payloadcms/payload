import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [
        {
          name: 'alt',
          type: 'text',
        },
      ],
      upload: {
        mimeTypes: ['image/*'],
      },
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
