import type { CollectionConfig } from 'payload'

import { scalarArticlesSlug } from '../../slugs.js'

export const ScalarArticles: CollectionConfig = {
  slug: scalarArticlesSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [{ name: 'title', type: 'text' }],
  versions: { drafts: true },
}
