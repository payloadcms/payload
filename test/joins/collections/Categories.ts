import type { CollectionConfig } from 'payload'

import { categoriesSlug, postsSlug } from '../shared.js'

export const Categories: CollectionConfig = {
  slug: categoriesSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'relatedPosts',
      label: 'Related Posts',
      type: 'join',
      collection: postsSlug,
      on: 'category',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'relatedPosts',
          label: 'Related Posts (Group)',
          type: 'join',
          collection: postsSlug,
          on: 'group.category',
        },
      ],
    },
  ],
}
