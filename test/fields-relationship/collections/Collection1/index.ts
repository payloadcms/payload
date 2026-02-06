import type { CollectionConfig } from 'payload'

import { collection1Slug } from '../../slugs.js'

export const Collection1: CollectionConfig = {
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  slug: collection1Slug,
  admin: {
    useAsTitle: 'name',
  },
}
