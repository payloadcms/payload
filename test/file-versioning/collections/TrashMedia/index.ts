import type { CollectionConfig } from 'payload'

import { trashMediaDir, trashMediaSlug } from '../../shared.js'

export const TrashMedia: CollectionConfig = {
  slug: trashMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  trash: true,
  upload: { staticDir: trashMediaDir },
  versions: true,
}
