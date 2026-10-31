import type { SharpCollectionConfig } from '@payloadcms/transformer-sharp'
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
  },
  versions: false,
}

export const uploadCollectionSharpOptions: SharpCollectionConfig = {
  variants: [
    {
      name: 'thumbnail',
      height: 100,
      width: 100,
    },
  ],
}
