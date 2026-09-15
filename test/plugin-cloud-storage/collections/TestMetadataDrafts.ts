import type { CollectionConfig } from 'payload'

import { testMetadataDraftsSlug } from '../shared.js'

export const TestMetadataDrafts: CollectionConfig = {
  slug: testMetadataDraftsSlug,
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
  versions: {
    drafts: true,
  },
}
