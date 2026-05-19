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
      name: 'subtitle',
      type: 'text',
      admin: {
        description:
          'A subtitle field to test focus indicators in the admin UI, helps us detect exiting out of rich text editor properly.',
      },
    },
  ],
}
