import type { CollectionConfig } from 'payload'

import { categoriesSlug, hiddenPostsSlug } from '../shared.js'

export const HiddenPosts: CollectionConfig = {
  slug: hiddenPostsSlug,
  admin: {
    useAsTitle: 'title',
    hidden: true,
    defaultColumns: ['title', 'category'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: categoriesSlug,
    },
  ],
}
