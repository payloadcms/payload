import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: ({ req }) => {
      if (req.user) return true

      return {
        publishedAt: {
          less_than_equal: new Date().toISOString(),
        },
      }
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'publishedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
