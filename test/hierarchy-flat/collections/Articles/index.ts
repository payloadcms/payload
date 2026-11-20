import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { articlesSlug, foldersSlug } from '../../shared.js'

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  access: { read: ({ req }) => (req.context.denyArticles ? false : { visible: { equals: true } }) },
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
