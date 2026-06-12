import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
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
  db: stubAdapter,
  jobs: {
    tasks: [
      {
        slug: 'send-welcome-email',
        handler: async ({ input, req }) => {
          await req.payload.findByID({ id: input.userId, collection: 'users' })
          return { output: {} }
        },
        inputSchema: [{ name: 'userId', type: 'text', required: true }],
      },
    ],
  },
  secret: 'eval-fixture',
})
