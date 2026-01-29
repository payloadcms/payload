import type { CollectionConfig } from 'payload'

import { postsSlug } from '../../slugs.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
    groupBy: true,
  },
  enableQueryPresets: true,
  lockDocuments: false,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
}
