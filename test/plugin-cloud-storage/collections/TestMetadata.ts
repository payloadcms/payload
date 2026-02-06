import type { CollectionConfig } from 'payload'

import { testMetadataSlug } from '../shared.js'

export const TestMetadata: CollectionConfig = {
  slug: testMetadataSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'testNote',
      type: 'text',
      admin: {
        description: 'Test note to identify this upload',
      },
    },
  ],
  upload: {
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
    ],
  },
}
