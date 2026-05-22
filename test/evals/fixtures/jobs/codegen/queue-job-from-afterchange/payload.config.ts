import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  jobs: {
    tasks: [
      {
        slug: 'send-welcome-email',
        inputSchema: [{ name: 'userId', type: 'text', required: true }],
        handler: async ({ input, req }) => {
          await req.payload.findByID({ collection: 'users', id: input.userId })
          return { output: {} }
        },
      },
    ],
  },
})
