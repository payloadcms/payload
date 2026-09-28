import type { CollectionConfig } from 'payload'

export const DraftPosts: CollectionConfig = {
  slug: 'draft-posts',
  admin: {
    group: 'Dashboard Data',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
}
