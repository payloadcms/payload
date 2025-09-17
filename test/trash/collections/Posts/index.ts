import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  trash: true,
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
