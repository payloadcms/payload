import type { CollectionConfig } from 'payload'

import { multiTenantPostsSlug } from '../shared.js'

export const MultiTenantPosts: CollectionConfig = {
  slug: multiTenantPostsSlug,
  access: {
    update: ({ req }) => req.context.allowMultiTenantPostUpdate !== false,
  },
  admin: {
    defaultColumns: ['title', 'category', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    { name: 'description', type: 'text' },
    { name: 'category', type: 'select', options: ['target', 'other'] },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: multiTenantPostsSlug,
    },
  ],
  trash: true,
  versions: { drafts: true },
}
