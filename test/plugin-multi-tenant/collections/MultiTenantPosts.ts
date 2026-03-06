import type { CollectionConfig } from 'payload'

import { multiTenantPostsSlug } from '../shared.js'

export const MultiTenantPosts: CollectionConfig = {
  slug: multiTenantPostsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: multiTenantPostsSlug,
    },
  ],
}
