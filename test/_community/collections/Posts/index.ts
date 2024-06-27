import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { mediaSlug } from '../Media'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const postsQuery1 = await req.payload.find({
          collection: 'posts',
          where: {
            text: {
              equals: 'hello',
            },
          },
        })

        console.log({ postsQuery1 })

        const postsQuery2 = await req.payload.find({
          collection: 'posts',
          where: {
            text: {
              equals: 'goodbye',
            },
          },
        })

        console.log({ postsQuery2 })

        return data
      },
    ],
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'associatedMedia',
      access: {
        create: () => true,
        update: () => false,
      },
      relationTo: mediaSlug,
      type: 'upload',
    },
  ],
  slug: postsSlug,
}
