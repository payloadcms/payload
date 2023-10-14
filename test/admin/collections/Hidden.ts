import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const CollectionHidden: CollectionConfig = {
  slug: 'hidden-collection',
  admin: {
    hidden: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
