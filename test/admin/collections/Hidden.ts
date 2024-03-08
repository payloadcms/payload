import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { hiddenCollectionSlug } from '../slugs.js'

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
