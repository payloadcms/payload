import type { CollectionConfig } from 'payload'

import { mediaDir, mediaSlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    read: ({ req }) => (req.user ? true : { alt: { not_equals: 'restricted' } }),
    readVersions: ({ req }) =>
      req.user ? true : { 'version.alt': { not_equals: 'version restricted' } },
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
