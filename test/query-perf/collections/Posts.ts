import type { CollectionConfig } from 'payload'

import { categoriesSlug, postsSlug } from './slugs.js'

export { postsSlug }

export const Posts: CollectionConfig = {
  slug: postsSlug,
  fields: [
    { name: 'title', type: 'text', index: true },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      index: true,
    },
    { name: 'priority', type: 'number', index: true },
    { name: 'score', type: 'number' },
    { name: 'views', type: 'number' },
    { name: 'authorName', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'language', type: 'text' },
    { name: 'version', type: 'number' },
    { name: 'rating', type: 'number' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: categoriesSlug,
    },
    // Join field — triggers sanitizeWhereQuery on the categories access result (#15891)
    {
      name: 'relatedCategories',
      type: 'join',
      collection: categoriesSlug,
      on: 'post',
    },
  ],
}
