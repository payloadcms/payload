import type { CollectionConfig } from 'payload'

import { queryDocsSlug, queryTextTagsSlug } from '../../slugs.js'

export const QueryTextTags: CollectionConfig = {
  slug: queryTextTagsSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [
    { name: 'id', type: 'text', required: true },
    { name: 'title', type: 'text' },
    { name: 'one', type: 'relationship', relationTo: queryDocsSlug },
  ],
}
