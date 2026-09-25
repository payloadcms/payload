export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'custom',
      type: 'text',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeExport: ({ value }) => String(value) + ' transformed',
          },
        },
      },
    },
  ],
}
