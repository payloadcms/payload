import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'media',
      fields: [
        {
          name: 'filename',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  jobs: {
    tasks: [],
  },
})
