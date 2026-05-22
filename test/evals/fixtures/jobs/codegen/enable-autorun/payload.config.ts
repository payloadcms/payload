import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
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
  jobs: {
    tasks: [
      {
        slug: 'process-post',
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        handler: async ({ input, req }) => {
          await req.payload.findByID({ collection: 'posts', id: input.postId })
          return { output: {} }
        },
      },
    ],
  },
})
