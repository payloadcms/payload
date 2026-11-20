import type { CollectionConfig } from 'payload'

import { articlesSlug } from '../../shared.js'

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  access: {
    create: () => true,
    delete: ({ id, req }) =>
      req.context.denyDeleteID === undefined || id !== req.context.denyDeleteID,
    read: () => true,
    update: () => true,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'ancestor', type: 'relationship', hasMany: false, relationTo: articlesSlug },
  ],
  hierarchy: { parentFieldName: 'ancestor' },
  trash: true,
}
