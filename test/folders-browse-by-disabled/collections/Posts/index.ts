import type { CollectionConfig } from 'payload'

import { postSlug } from '../../shared.js'

export const Posts: CollectionConfig = {
  slug: postSlug,
  admin: {
    useAsTitle: 'title',
  },
  folders: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
