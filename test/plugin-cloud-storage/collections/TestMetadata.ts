import type { CollectionConfig } from 'payload'

import { testMetadataSlug } from '../shared.js'

export const TestMetadata: CollectionConfig = {
  slug: testMetadataSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    { name: 'bucketName', type: 'text' },
    { name: 'customStorageId', type: 'text' },
    { name: 'objectKey', type: 'text' },
    { name: 'processingStatus', type: 'text' },
    { name: 'storageProvider', type: 'text' },
    {
      name: 'testNote',
      type: 'text',
      admin: {
        description: 'Test note to identify this upload',
      },
    },
    { name: 'uploadTimestamp', type: 'text' },
    { name: 'uploadVersion', type: 'text' },
  ],
  upload: {
    adminThumbnail: 'thumbnail',
  },
  versions: false,
}
