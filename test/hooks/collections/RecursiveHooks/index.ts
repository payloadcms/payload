import type { CollectionConfig } from 'payload'

export const recursiveHooksSlug = 'recursive-hooks'

export const RecursiveHooksCollection: CollectionConfig = {
  slug: recursiveHooksSlug,
  hooks: {
    beforeOperation: [
      async ({ req, context, args }) => {
        // Trigger an infinite loop
        await req.payload.find({
          collection: recursiveHooksSlug,
          req,
          context,
          limit: 1,
          depth: 0,
        })

        return args
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
