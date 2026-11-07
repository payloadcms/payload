import type { CollectionConfig } from 'payload'

import { videosSlug } from '../../shared.js'

export const Videos: CollectionConfig = {
  slug: videosSlug,
  access: {
    create: ({ req }) => Boolean(req.user) && req.headers.get('x-disallow-create') !== 'true',
    read: () => true,
    update: ({ req }) => Boolean(req.user) && req.headers.get('x-disallow-update') !== 'true',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    disableLocalStorage: true,
    transfer: {
      // Small values keep test files small: S3's minimum part size, and a low session threshold.
      multipartThreshold: 6 * 1024 * 1024,
      preferredSegmentSize: 5 * 1024 * 1024,
    },
  },
  versions: false,
}
