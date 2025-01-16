import type { CollectionConfig } from 'payload'

import { postsSlug } from '../shared.js'

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
      name: 'excerpt',
      label: 'Excerpt',
      type: 'text',
    },
    {
      type: 'text',
      name: 'slug',
      localized: true,
    },
    {
      name: 'relatedLinks',
      relationTo: 'links',
      type: 'relationship',
    },
  ],
}
