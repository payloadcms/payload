import type { CollectionConfig } from 'payload'

import { postsSlug } from '../shared.js'
import { userFilterOptions } from './Users/filterOptions.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'relatedLinks',
      relationTo: 'links',
      type: 'relationship',
    },
    {
      name: 'author',
      relationTo: 'users',
      type: 'relationship',
      filterOptions: userFilterOptions,
    },
  ],
}
