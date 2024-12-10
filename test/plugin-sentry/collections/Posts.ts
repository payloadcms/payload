import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: () => false,
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
}
