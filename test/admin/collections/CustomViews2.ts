import type { CollectionConfig } from 'payload'

import { customCollectionMetaTitle } from '../shared.js'
import { customViews2CollectionSlug } from '../slugs.js'

export const CustomViews2: CollectionConfig = {
  slug: customViews2CollectionSlug,
  admin: {
    meta: {
      title: customCollectionMetaTitle,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
