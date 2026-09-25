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
  upload: { filesRequiredOnCreate: false, staticDir: mediaDir },
  versions: true,
}
