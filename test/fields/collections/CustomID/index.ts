import type { CollectionConfig } from 'payload'

import { customIdSlug } from '../../slugs.js'

export const CustomIdCollection: CollectionConfig = {
  slug: customIdSlug,
  versions: true,
  fields: [
    {
      name: 'id',
      type: 'text',
    },
  ],
}
