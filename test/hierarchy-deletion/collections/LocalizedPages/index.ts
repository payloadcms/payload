import type { CollectionConfig } from 'payload'

import { localizedPagesSlug } from '../../shared.js'

export const LocalizedPages: CollectionConfig = {
  slug: localizedPagesSlug,
  access: { create: () => true, delete: () => true, read: () => true, update: () => true },
  admin: { useAsTitle: 'title' },
  fields: [{ name: 'title', type: 'text', localized: true }],
  hierarchy: { parentFieldName: 'parent' },
  versions: { drafts: true },
}
