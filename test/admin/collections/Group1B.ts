import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { group1Collection2Slug } from '../slugs'

export const CollectionGroup1B: CollectionConfig = {
  slug: group1Collection2Slug,
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
