import type { CollectionConfig } from 'payload'

import { textCollectionSlug } from '../slugs.js'

export const TextCollection: CollectionConfig = {
  slug: textCollectionSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
}
