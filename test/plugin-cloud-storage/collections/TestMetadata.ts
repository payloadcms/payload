import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { testMetadataSlug } from '../shared.js'
import { throwingHookError } from './MediaWithThrowingHook.js'

export const TestMetadata: CollectionConfig = {
  slug: testMetadataSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
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
  hooks: {
    afterChange: [
      ({ doc, operation, req }) => {
        if (
          operation === 'update' &&
          req.context?.skipCloudStorage &&
          doc.testNote === 'Throw on internal update'
        ) {
          throw new APIError(throwingHookError, 500, null, true)
        }

        return doc
      },
    ],
  },
  upload: {
    adminThumbnail: 'thumbnail',
    formatOptions: { format: 'webp' },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
    ],
  },
  versions: false,
}
