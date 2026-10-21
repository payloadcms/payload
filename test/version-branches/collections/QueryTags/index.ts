import type { CollectionConfig } from 'payload'

import { queryDocsSlug, queryTagsSlug } from '../../slugs.js'

export const QueryTags: CollectionConfig = {
  slug: queryTagsSlug,
  access: {
    create: () => true,
    read: ({ req }) => req.context.queryTagAccess ?? true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    { name: 'id', type: 'number' },
    { name: 'title', type: 'text' },
    { name: 'one', type: 'relationship', relationTo: queryDocsSlug },
    { name: 'owner', type: 'relationship', relationTo: queryDocsSlug },
    { name: 'owners', type: 'relationship', relationTo: queryDocsSlug, hasMany: true },
    {
      name: 'polyOwners',
      type: 'relationship',
      relationTo: [queryDocsSlug, queryTagsSlug],
      hasMany: true,
    },
  ],
}
