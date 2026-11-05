export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'rel',
      type: 'relationship',
      relationTo: 'users',
      custom: {
        'plugin-import-export': {
          toCSV: ({ value }) => String(value) + ' exported',
          fromCSV: ({ value }) => String(value) + '_imported',
        },
      },
    },
  ],
}
