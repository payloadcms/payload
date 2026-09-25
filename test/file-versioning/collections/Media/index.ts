import type { CollectionConfig } from 'payload'

import { mediaDir, mediaSlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  hooks: {
    afterChange: [
      ({ doc }) => {
        if (doc.alt === 'reject-after-write') {
          throw new Error('Rejected after the file and document write')
        }
        return doc
      },
    ],
  },
  upload: { filesRequiredOnCreate: false, staticDir: mediaDir },
  versions: true,
}
