import type { CollectionConfig } from 'payload'

import { localizedCollectionSlug } from '../slugs.js'

const LocalizedPosts: CollectionConfig = {
  slug: localizedCollectionSlug,
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'text',
      localized: true,
    },
  ],
}

export default LocalizedPosts
