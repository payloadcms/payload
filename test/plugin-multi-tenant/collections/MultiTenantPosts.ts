import type { CollectionConfig } from 'payload'

import { multiTenantPostsSlug } from '../shared.js'

export const MultiTenantPosts: CollectionConfig = {
  slug: multiTenantPostsSlug,
  access: {
    update: ({ req }) => req.context.allowMultiTenantPostUpdate === true,
  },
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
  versions: false,
}
