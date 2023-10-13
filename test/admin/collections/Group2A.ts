import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const CollectionGroup2A: CollectionConfig = {
  slug: 'group-two-collection-ones',
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
