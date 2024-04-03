import type { CollectionConfig } from 'payload/types'

import { uploadCollectionSlug } from '../slugs.js'

export const UploadCollection: CollectionConfig = {
  slug: uploadCollectionSlug,
  upload: {
    adminThumbnail: () => 'https://payloadcms.com/images/universal-truth.jpg',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
