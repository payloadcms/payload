export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'normal',
      type: 'text',
      custom: {
        'plugin-import-export': {
          disabled: true,
          hooks: {
            beforeExport: ({ value }) => value,
          },
        },
      },
    },
  ],
}
