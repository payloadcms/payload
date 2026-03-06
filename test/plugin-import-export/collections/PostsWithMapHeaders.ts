import type { CollectionConfig } from 'payload'

import { postsWithMapHeadersSlug } from '../shared.js'

export const PostsWithMapHeaders: CollectionConfig = {
  slug: postsWithMapHeadersSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Post Title',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      label: 'Short Summary',
      type: 'text',
    },
    {
      name: 'views',
      label: 'View Count',
      type: 'number',
    },
  ],
}
