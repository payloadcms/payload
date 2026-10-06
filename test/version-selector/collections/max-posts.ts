import type { CollectionConfig } from 'payload'

import { maxPostsSlug } from '../slugs.js'

export const MaxPosts: CollectionConfig = {
  slug: maxPostsSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    readVersions: () => true,
    update: () => true,
  },
  fields: [{ name: 'title', type: 'text' }],
  versions: { drafts: true, maxPerDoc: 1 },
}
