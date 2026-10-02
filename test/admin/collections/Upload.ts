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
    adminThumbnail: () =>
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
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
