import type { CollectionConfig } from 'payload'

import { foldersSlug } from '../../shared.js'

export const Folders: CollectionConfig = {
  slug: foldersSlug,
  access: { read: () => true },
  admin: { useAsTitle: 'name' },
  fields: [{ name: 'name', type: 'text' }],
  folders: true,
}
