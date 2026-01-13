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
    // Metadata fields that will be automatically populated by the custom adapter
    {
      name: 'customStorageId',
      type: 'text',
      admin: {
        description: 'Custom storage identifier from adapter',
        readOnly: true,
      },
    },
    {
      name: 'uploadTimestamp',
      type: 'text',
      admin: {
        description: 'Upload timestamp from adapter',
        readOnly: true,
      },
    },
    {
      name: 'storageProvider',
      type: 'text',
      admin: {
        description: 'Storage provider name from adapter',
        readOnly: true,
      },
    },
    {
      name: 'bucketName',
      type: 'text',
      admin: {
        description: 'Storage bucket name from adapter',
        readOnly: true,
      },
    },
    {
      name: 'objectKey',
      type: 'text',
      admin: {
        description: 'Storage object key from adapter',
        readOnly: true,
      },
    },
    {
      name: 'processingStatus',
      type: 'text',
      admin: {
        description: 'Processing status from adapter',
        readOnly: true,
      },
    },
    {
      name: 'uploadVersion',
      type: 'text',
      admin: {
        description: 'Upload version from adapter',
        readOnly: true,
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
