import type { CollectionConfig } from 'payload'

import { plainMediaDir, plainMediaSlug } from '../../shared.js'

export const PlainMedia: CollectionConfig = {
  slug: plainMediaSlug,
  access: { create: () => true, read: () => true, update: () => true },
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: plainMediaDir },
  versions: false,
}
