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
  jobs: {
    tasks: [
      {
        slug: 'validate-post',
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        outputSchema: [{ name: 'valid', type: 'checkbox', required: true }],
        handler: async ({ input, req }) => {
          const post = await req.payload.findByID({ collection: 'posts', id: input.postId })
          return { output: { valid: post.status !== 'draft' } }
        },
      },
      {
        slug: 'notify-subscribers',
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        outputSchema: [{ name: 'notified', type: 'number', required: true }],
        handler: async ({ input, req }) => {
          const subs = await req.payload.find({ collection: 'subscribers', limit: 0 })
          return { output: { notified: subs.totalDocs } }
        },
      },
    ],
    workflows: [],
  },
})
