import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        disabled: { column: true, filter: true },
      },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        disabled: { bulkEdit: true, groupBy: true },
      },
    },
    {
      name: 'normal',
      type: 'text',
    },
  ],
}
