import type { CollectionConfig } from 'payload'

import { videosSlug } from '../../shared.js'

export const Videos: CollectionConfig = {
  slug: videosSlug,
  access: {
    create: ({ req }) => Boolean(req.user),
    read: () => true,
    update: ({ req }) => Boolean(req.user),
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
      // Small values keep test files small. Vercel Blob multipart parts must be 5MiB or more.
      multipartThreshold: 6 * 1024 * 1024,
      preferredSegmentSize: 5 * 1024 * 1024,
    },
  },
  versions: false,
}
