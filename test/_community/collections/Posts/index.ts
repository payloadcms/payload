import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  defaultSort: '-updatedAt',
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
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      type: 'relationship',
      name: 'relatedArticle',
      relationTo: 'posts',
      admin: {
        sortOptions: '-updatedAt',
      },
    },
  ],
}
