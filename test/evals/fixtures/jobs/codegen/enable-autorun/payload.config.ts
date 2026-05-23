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
      ],
    },
  ],
  db: stubAdapter,
  jobs: {
    tasks: [
      {
        slug: 'process-post',
        handler: async ({ input, req }) => {
          await req.payload.findByID({ id: input.postId, collection: 'posts' })
          return { output: {} }
        },
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
      },
    ],
  },
  secret: 'eval-fixture',
})
