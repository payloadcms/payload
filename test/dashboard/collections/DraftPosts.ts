import type { CollectionConfig } from 'payload'

export const DraftPosts: CollectionConfig = {
  slug: 'draft-posts',
  admin: {
    group: 'Dashboard Data',
    useAsThumbnail: 'cover',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  versions: {
    drafts: true,
  },
}
