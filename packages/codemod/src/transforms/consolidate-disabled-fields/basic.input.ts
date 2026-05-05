import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        disableBulkEdit: true,
        disableGroupBy: true,
      },
    },
    {
      name: 'normal',
      type: 'text',
    },
  ],
}
