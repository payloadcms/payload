import type { CollectionConfig } from 'payload'

import { bulkActionPostsSlug } from '../shared.js'

export const BulkActionPosts: CollectionConfig = {
  slug: bulkActionPostsSlug,
  admin: {
    defaultColumns: ['title', 'category', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'category', type: 'select', options: ['target', 'other'] },
  ],
  trash: true,
  versions: { drafts: true },
}
