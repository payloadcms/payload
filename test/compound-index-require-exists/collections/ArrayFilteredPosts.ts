import type { CollectionConfig } from 'payload'

import { arrayFilteredPostsSlug } from '../shared.js'

export const ArrayFilteredPosts: CollectionConfig = {
  slug: arrayFilteredPostsSlug,
  fields: [
    { name: 'tenant', type: 'text', required: true },
    { name: 'code', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [{ name: 'gate', type: 'text' }],
    },
  ],
  indexes: [{ fields: ['tenant', 'code'], requireExists: ['items.gate'], unique: true }],
}
