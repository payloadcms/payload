import type { CollectionConfig } from 'payload'

import { uploadCollectionSlug } from '../slugs.js'

export const UploadCollection: CollectionConfig = {
  slug: uploadCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 100,
        height: 100,
      },
    ],
    adminThumbnail: () => 'https://payloadcms.com/images/universal-truth.jpg',
  },
}
