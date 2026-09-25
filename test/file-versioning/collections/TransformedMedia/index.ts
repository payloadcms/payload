import type { CollectionConfig } from 'payload'

import { transformedMediaDir, transformedMediaSlug } from '../../shared.js'

export const TransformedMedia: CollectionConfig = {
  slug: transformedMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: transformedMediaDir },
  versions: true,
}
