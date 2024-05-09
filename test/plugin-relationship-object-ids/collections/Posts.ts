import type { CollectionConfig } from 'payload/types'

import { postsSlug } from '../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
