import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { group1Collection1Slug } from '../slugs.js'

export const CollectionGroup1A: CollectionConfig = {
  slug: group1Collection1Slug,
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
