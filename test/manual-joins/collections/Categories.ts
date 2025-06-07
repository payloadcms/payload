import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'posts',
      type: 'join',
      collection: 'posts',
      on: 'category',
      defaultLimit: 10,
      defaultSort: '-title',
    },
  ],
}
