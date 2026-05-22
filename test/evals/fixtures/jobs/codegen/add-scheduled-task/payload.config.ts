import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'temp-files',
      fields: [
        {
          name: 'filename',
          type: 'text',
          required: true,
        },
        {
          name: 'createdAt',
          type: 'date',
        },
      ],
    },
  ],
  jobs: {
    tasks: [],
  },
})
