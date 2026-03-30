import type { CollectionConfig } from 'payload'

import { categoriesSlug, postsSlug } from './slugs.js'

export { categoriesSlug }

export const Categories: CollectionConfig = {
  slug: categoriesSlug,
  access: {
    // Returns a where clause so sanitizeWhereQuery runs on every join access check (#15891)
    read: () => ({ title: { exists: true } }),
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'text' },
    // Required by the join field `on: 'post'` in Posts
    {
      name: 'post',
      type: 'relationship',
      relationTo: postsSlug,
    },
  ],
}
