import type { CollectionConfig } from 'payload'

import { foldersSlug } from '../../shared.js'

export const Folders: CollectionConfig = {
  slug: foldersSlug,
  admin: {
    baseFilter: () => ({ scope: { equals: 'public' } }),
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'scope', type: 'text', required: true },
  ],
  folders: {
    collectionSpecific: true,
    joinField: { name: 'contents' },
  },
}
