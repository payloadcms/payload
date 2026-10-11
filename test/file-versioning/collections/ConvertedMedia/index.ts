import type { CollectionConfig } from 'payload'

import { convertedMediaDir, convertedMediaSlug } from '../../shared.js'

export const ConvertedMedia: CollectionConfig = {
  slug: convertedMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: convertedMediaDir },
  versions: true,
}
