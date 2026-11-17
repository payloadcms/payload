import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { assetsSlug, containersSlug } from '../../shared.js'

export const Assets: CollectionConfig = {
  slug: assetsSlug,
  access: { read: () => true },
  admin: { useAsTitle: 'caption' },
  fields: [{ name: 'caption', type: 'text' }, createFolderField({ relationTo: containersSlug })],
  timestamps: false,
  versions: false,
}
