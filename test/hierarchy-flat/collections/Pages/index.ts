import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { foldersSlug, pagesSlug } from '../../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  access: { read: () => ({ visible: { equals: true } }) },
  admin: {
    baseFilter: () => ({ scope: { equals: 'public' } }),
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'scope', type: 'text', required: true },
    { name: 'visible', type: 'checkbox' },
    createFolderField({ relationTo: foldersSlug }),
  ],
}
