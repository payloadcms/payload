import type { CollectionConfig } from 'payload'

import { localizedMediaDir, localizedMediaSlug } from '../../shared.js'

export const LocalizedMedia: CollectionConfig = {
  slug: localizedMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text', localized: true }],
  upload: { staticDir: localizedMediaDir },
  versions: { drafts: true },
}
