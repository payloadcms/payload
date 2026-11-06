import type { CollectionConfig } from 'payload'

import { localizedPostsSlug } from '../shared.js'

export const LocalizedPosts: CollectionConfig = {
  slug: localizedPostsSlug,
  fields: [
    { name: 'tenant', type: 'text', required: true },
    { name: 'slug', type: 'text', localized: true },
  ],
  indexes: [{ fields: ['tenant', 'slug'], requireExists: ['slug'], unique: true }],
  versions: { drafts: true },
}
