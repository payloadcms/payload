import type { CollectionConfig } from 'payload'

import { imagesTransformedSlug } from '../../shared.js'

/** The Sharp transformer converts every main file to WebP, so the main file gets a new object key. */
export const ImagesTransformed: CollectionConfig = {
  slug: imagesTransformedSlug,
  fields: [
    { name: 'title', type: 'text' },
    { name: 'caption', type: 'text', localized: true },
  ],
  upload: {
    disableLocalStorage: true,
    mimeTypes: ['image/*'],
    transfer: {
      multipartThreshold: 6 * 1024 * 1024,
      preferredSegmentSize: 5 * 1024 * 1024,
    },
  },
  versions: false,
}
