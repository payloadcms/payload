import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { group2Collection1Slug } from '../slugs'

export const CollectionGroup2A: CollectionConfig = {
  slug: group2Collection1Slug,
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
