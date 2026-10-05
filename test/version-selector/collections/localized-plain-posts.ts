import type { CollectionConfig } from 'payload'

import { plainLocalizedPostsSlug } from '../slugs.js'

export const LocalizedPlainPosts: CollectionConfig = {
  slug: plainLocalizedPostsSlug,
  access: { create: () => true, delete: () => true, read: () => true, update: () => true },
  fields: [{ name: 'title', type: 'text', localized: true }],
}
