import type { CollectionConfig } from 'payload'

export const VersionedPostsCollection: CollectionConfig = {
  slug: 'versioned-posts',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'number',
      type: 'number',
    },
  ],
}
