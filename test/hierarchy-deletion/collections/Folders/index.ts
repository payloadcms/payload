import type { CollectionConfig } from 'payload'

import { foldersSlug } from '../../shared.js'

export const Folders: CollectionConfig = {
  slug: foldersSlug,
  access: { create: () => true, delete: () => true, read: () => true, update: () => true },
  admin: { useAsTitle: 'title' },
  fields: [{ name: 'title', type: 'text', required: true }],
  folders: true,
}
