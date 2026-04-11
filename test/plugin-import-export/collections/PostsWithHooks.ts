import type { CollectionConfig } from 'payload'

import { postsWithHooksSlug } from '../shared.js'

export const PostsWithHooks: CollectionConfig = {
  slug: postsWithHooksSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'secret',
      type: 'text',
    },
    {
      name: 'count',
      type: 'number',
    },
  ],
}
