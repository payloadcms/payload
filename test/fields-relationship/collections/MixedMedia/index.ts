import type { CollectionConfig } from 'payload'

import {
  mixedMediaCollectionSlug,
  podcastCollectionSlug,
  videoCollectionSlug,
} from '../../slugs.js'

export const MixedMedia: CollectionConfig = {
  slug: mixedMediaCollectionSlug,
  fields: [
    {
      type: 'relationship',
      name: 'relatedMedia',
      relationTo: [videoCollectionSlug, podcastCollectionSlug],
      hasMany: true,
    },
  ],
}
