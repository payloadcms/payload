import { CollectionConfig } from 'payload/types'

export const Prompt: CollectionConfig = {
  slug: 'prompt',
  admin: {
    useAsTitle: 'prompt',
  },
  fields: [
    {
      name: 'prompt',
      type: 'text',
      required: true,
    },
    // WIP: Disabled
    // {
    //   name: 'embeddings',
    //   type: 'relationship',
    //   relationTo: 'embedding',
    // access: {
    //   create: () => false,
    //   update: () => false,
    // },
    // hooks: {
    //   afterRead: [
    //     async ({ data, req }) => {
    //       const { id } = data

    //       if (!req.query.embedding) return

    //       const embedding = await req.payload.find({
    //         req,
    //         collection: 'embedding',
    //         // where: {
    //         //   prompt: { equals: id },
    //         // },
    //         limit: 0,
    //         depth: 0,
    //         pagination: false,
    //       })

    //       return [...embedding.docs]
    //     },
    //   ],
    // },
    // },
  ],
}
