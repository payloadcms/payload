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
      name: 'textField',
      type: 'text',
    },
    {
      name: 'virtualText',
      type: 'text',
      virtual: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return `${siblingData.textField || 'no textField value'}`
          },
        ],
      },
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
    },
  ],
}
