import type { CollectionConfig } from 'payload'

import { localizedStatusArticlesSlug } from '../../slugs.js'

export const LocalizedStatusArticles: CollectionConfig = {
  slug: localizedStatusArticlesSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [
    { name: 'shared', type: 'text' },
    { name: 'title', type: 'text', localized: true },
  ],
  versions: { drafts: { localizeStatus: true } },
}
