import type { CollectionConfig } from 'payload'

import { nestedReadArticlesSlug, queryDocsSlug } from '../../slugs.js'

export const NestedReadArticles: CollectionConfig = {
  slug: nestedReadArticlesSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'references',
      type: 'group',
      fields: [{ name: 'target', type: 'relationship', relationTo: queryDocsSlug }],
    },
  ],
  versions: { drafts: true },
}
