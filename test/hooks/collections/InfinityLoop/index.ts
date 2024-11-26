import type { CollectionConfig } from 'payload'

export const InfinityLoop: CollectionConfig = {
  slug: 'infinity-loop',
  fields: [],
  hooks: {
    afterRead: [
      async ({ req, context, doc }) => {
        if (typeof context.callDepth === 'number') {
          if (context.callDepth === 0) {
            return
          }

          // fetch self
          await req.payload.findByID({
            req,
            id: doc.id,
            collection: 'infinity-loop',
            context: {
              callDepth: context.callDepth - 1,
            },
          })
        }
      },
    ],
  },
}
