import type { CollectionConfig } from 'payload'

import { postsWithHooksJobsSlug } from '../shared.js'

/**
 * Mirrors PostsWithHooks, but its plugin config leaves the jobs queue enabled so the
 * import/export run through their task handlers rather than the synchronous path.
 */
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
