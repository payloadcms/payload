import type { CollectionConfig } from 'payload'

import { group2Collection2Slug } from '../slugs.js'

export const CollectionGroup2B: CollectionConfig = {
  slug: group2Collection2Slug,
  admin: {
    group: 'One',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
