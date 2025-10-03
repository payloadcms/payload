import type { GlobalConfig } from 'payload'

export const recursiveHooksGlobalSlug = 'recursive-hooks-global'

export const RecursiveHooksGlobal: GlobalConfig = {
  slug: recursiveHooksGlobalSlug,
  hooks: {
    beforeOperation: [
      async ({ req, context, args }) => {
        // Trigger an infinite loop
        await req.payload.findGlobal({
          slug: recursiveHooksGlobalSlug,
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
