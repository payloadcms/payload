import type { CollectionConfig } from 'payload'

import { collection2Slug } from '../../slugs.js'

export const Collection2: CollectionConfig = {
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  slug: collection2Slug,
}
