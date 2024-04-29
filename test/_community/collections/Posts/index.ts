import type { CollectionConfig } from 'payload/types'

import { mediaSlug } from '../Media/index.js'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
    },
    // {
    //   type: 'row',
    //   fields: [],
    // },
    // {
    //   name: 'associatedMedia',
    //   type: 'upload',
    //   access: {
    //     create: () => true,
    //     update: () => false,
    //   },
    //   relationTo: mediaSlug,
    // },

    {
      name: 'optionsAvailable',
      type: 'select',
      hasMany: true,
      options: ['size', 'color'],
    },
    {
      type: 'array',
      name: 'variants',
      admin: {
        condition: (data) => {
          return data?.optionsAvailable?.length > 0
        },
      },
      fields: [
        {
          name: 'color',
          type: 'select',
          admin: {
            condition: (data) => {
              // broken condition
              return data?.optionsAvailable.includes('color')
            },
          },
          options: [{ value: 'piece', label: 'Piece' }],
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
