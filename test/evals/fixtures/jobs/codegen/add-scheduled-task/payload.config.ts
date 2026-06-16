import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
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
  db: stubAdapter,
  jobs: {
    tasks: [],
  },
  secret: 'eval-fixture',
})
