import type { CollectionConfig } from 'payload'

import { plainPostsSlug } from '../slugs.js'

export const PlainPosts: CollectionConfig = {
  slug: plainPostsSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'title', type: 'text' }],
}
