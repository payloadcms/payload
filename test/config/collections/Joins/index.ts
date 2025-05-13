import type { CollectionConfig } from 'payload'

export const postsSlug = 'joins'
export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
