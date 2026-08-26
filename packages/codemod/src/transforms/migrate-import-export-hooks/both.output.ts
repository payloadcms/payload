export const Posts = {
  slug: 'posts',
  fields: [
    {
      name: 'rel',
      type: 'relationship',
      relationTo: 'users',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeExport: ({ value }) => String(value) + ' exported',
            beforeImport: ({ value }) => String(value) + '_imported',
          },
        },
      },
    },
  ],
}
