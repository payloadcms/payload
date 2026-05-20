export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'f',
      type: 'text',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeExport: ({ value }) => String(value) + ' modern',
          },
          toCSV: ({ value }) => String(value) + ' legacy',
        },
      },
    },
  ],
}
