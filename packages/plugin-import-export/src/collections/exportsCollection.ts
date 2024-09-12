import type { CollectionConfig } from 'payload'

import { exportsCollectionSlug } from '../constants.js'

export const exportsCollection: CollectionConfig = {
  slug: exportsCollectionSlug,
  admin: {
    hidden: true,
  },
  endpoints: false,
  fields: [
    {
      name: 'collectionExports',
      type: 'array',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
        {
          name: 'data',
          type: 'json',
          required: true,
        },
      ],
    },
  ],
  graphQL: false,
}
