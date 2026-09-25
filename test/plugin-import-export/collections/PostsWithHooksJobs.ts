import type { CollectionConfig } from 'payload'

import { postsWithHooksJobsSlug } from '../shared.js'

export const PostsWithHooksJobs: CollectionConfig = {
  slug: postsWithHooksJobsSlug,
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
      name: 'count',
      type: 'number',
    },
  ],
  versions: false,
}
