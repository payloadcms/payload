import type { CollectionConfig } from 'payload'

import { joinFieldsSlug, joinPostsSlug } from '../../slugs.js'

/**
 * Posts collection for testing Join fields.
 * These documents are displayed via join fields in the JoinFields collection.
 */
const JoinPosts: CollectionConfig = {
  slug: joinPostsSlug,
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
      name: 'category',
      type: 'relationship',
      relationTo: joinFieldsSlug,
      admin: {
        description: 'The parent category (used by join fields)',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}

export default JoinPosts
