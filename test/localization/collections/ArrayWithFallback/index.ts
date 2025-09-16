import type { CollectionConfig } from 'payload'

import { arrayWithFallbackCollectionSlug } from '../../shared.js'

export const ArrayWithFallbackCollection: CollectionConfig = {
  slug: arrayWithFallbackCollectionSlug,
  fields: [
    {
      name: 'items',
      type: 'array',
      localized: true,
      required: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'itemsReadOnly',
      type: 'array',
      localized: true,
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
