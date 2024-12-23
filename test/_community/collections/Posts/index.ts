import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
