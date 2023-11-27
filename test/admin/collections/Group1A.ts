import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { group1Collection1Slug } from '../slugs'

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
