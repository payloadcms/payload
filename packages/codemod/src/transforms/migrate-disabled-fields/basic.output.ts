export const Posts = {
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
