import type { CollectionConfig } from 'payload'

import { protectedArticlesSlug } from '../../slugs.js'
import { Articles } from '../Articles/index.js'

export const ProtectedArticles: CollectionConfig = {
  ...Articles,
  slug: protectedArticlesSlug,
  dbName: 'protected_articles',
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    readVersions: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
}
