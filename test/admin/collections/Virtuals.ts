import type { CollectionConfig } from 'payload'

import { virtualsSlug } from '../slugs.js'

export const Virtuals: CollectionConfig = {
  slug: virtualsSlug,
  admin: {
    useAsTitle: 'virtualTitleFromPost',
  },
  fields: [
    {
      name: 'virtualTitleFromPost',
      type: 'text',
      virtual: 'post.title',
    },
    {
      name: 'virtualText',
      type: 'text',
      virtual: true,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
    },
  ],
}
