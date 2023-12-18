import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { hiddenCollectionSlug } from '../slugs'

export const CollectionHidden: CollectionConfig = {
  slug: hiddenCollectionSlug,
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
