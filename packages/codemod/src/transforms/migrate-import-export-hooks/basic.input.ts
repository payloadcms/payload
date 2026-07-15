export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'custom',
      type: 'text',
      custom: {
        'plugin-import-export': {
          toCSV: ({ value }) => String(value) + ' transformed',
        },
      },
    },
  ],
}
