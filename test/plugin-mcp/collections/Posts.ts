import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'The title of the post',
      },
      required: true,
    },
    {
      name: 'content',
      type: 'text',
      localized: true,
      admin: {
        description: 'The content of the post',
      },
      defaultValue: 'Hello World.',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The author of the post',
      },
    },
  ],
}
