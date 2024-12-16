import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'myArray',
      type: 'array',
      admin: {
        components: {
          RowLabel: '/collections/Posts/RowLabel',
        },
      },
      fields: [
        {
          type: 'text',
          name: 'text',
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
