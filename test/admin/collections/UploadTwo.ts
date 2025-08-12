import type { CollectionConfig } from 'payload'

import { uploadTwoCollectionSlug } from '../slugs.js'

export const UploadTwoCollection: CollectionConfig = {
  slug: uploadTwoCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  upload: true,
}
