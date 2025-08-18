import type { CollectionConfig } from 'payload'

import { videoCollectionSlug } from '../../slugs.js'

export const Video: CollectionConfig = {
  slug: videoCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'id',
      type: 'number',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
    },
  ],
}
