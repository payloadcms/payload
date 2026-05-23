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
          name: 'viewCount',
          type: 'number',
          defaultValue: 0,
        },
      ],
      hooks: {
        // PROBLEM: this hook calls payload.update on the same collection,
        // which will trigger this hook again — creating an infinite loop.
        afterChange: [
          async ({ doc, req }) => {
            await req.payload.update({
              id: doc.id,
              collection: 'posts',
              data: { viewCount: (doc.viewCount ?? 0) + 1 },
            })
            return doc
          },
        ],
      },
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
