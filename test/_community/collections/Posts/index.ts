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
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'ui',
          type: 'ui',
          admin: {
            components: {
              Field: '/Field.tsx',
            },
          },
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
