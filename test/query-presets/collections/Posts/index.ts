import type { CollectionConfig } from 'payload'

import { pagesSlug, postsSlug } from '../../slugs.js'

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
      name: 'relatedPages',
      type: 'relationship',
      hasMany: true,
      relationTo: pagesSlug,
    },
    {
      name: 'text',
      type: 'text',
    },
  ],
  versions: false,
}
