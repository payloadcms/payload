import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const CollectionGroup2B: CollectionConfig = {
  slug: 'group-two-collection-twos',
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
