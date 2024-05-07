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
    {
      name: 'postCategory',
      type: 'relationship',
      // localized: true,
      relationTo: 'categories',
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      localized: true,
      relationTo: 'categories',
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          localized: true,
          relationTo: 'categories',
          required: true,
        },
      ],
    },
    {
      name: 'associatedMedia',
      type: 'relationship',
      relationTo: mediaSlug,
    },
  ],
  versions: {
    drafts: true,
  },
}
