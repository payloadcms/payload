export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'f',
      type: 'text',
      custom: {
        'plugin-import-export': {
          disabled: true,
          hooks: {
            beforeImport: ({ value }) => value,
          },
          toCSV: ({ value }) => String(value) + ' exported',
        },
      },
    },
  ],
}
