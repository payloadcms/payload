import type { CollectionConfig } from 'payload'

export const draftPostsSlug = 'draft-posts'

export const DraftPostsCollection: CollectionConfig = {
  slug: draftPostsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
