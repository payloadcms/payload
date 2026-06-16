import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
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
  db: stubAdapter,
  jobs: {
    tasks: [],
  },
  secret: 'eval-fixture',
})
