import type { CollectionConfig } from 'payload'

import { collectionWithLivePreviewSlug } from '../slugs.js'

export const CollectionWithLivePreview: CollectionConfig = {
  slug: collectionWithLivePreviewSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
