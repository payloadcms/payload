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
          name: 'status',
          type: 'select',
          options: ['draft', 'published'],
        },
      ],
    },
    {
      slug: 'subscribers',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
  ],
  db: stubAdapter,
  jobs: {
    tasks: [
      {
        slug: 'validate-post',
        handler: async ({ input, req }) => {
          const post = await req.payload.findByID({ id: input.postId, collection: 'posts' })
          return { output: { valid: post.status !== 'draft' } }
        },
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        outputSchema: [{ name: 'valid', type: 'checkbox', required: true }],
      },
      {
        slug: 'notify-subscribers',
        handler: async ({ input, req }) => {
          const subs = await req.payload.find({ collection: 'subscribers', limit: 0 })
          return { output: { notified: subs.totalDocs } }
        },
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        outputSchema: [{ name: 'notified', type: 'number', required: true }],
      },
    ],
    workflows: [],
  },
  secret: 'eval-fixture',
})
