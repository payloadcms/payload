import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    enableListViewSelectAPI: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'customField',
      type: 'text',
      admin: {
        components: {
          Field: '/components/CustomTextFieldClient/index.js#CustomTextFieldClient',
        },
      },
    },
  ],
}
