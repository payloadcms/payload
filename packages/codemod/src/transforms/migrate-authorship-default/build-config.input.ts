import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'media',
      fields: [],
      upload: true,
    },
  ],
  globals: [
    {
      slug: 'header',
      fields: [
        {
          name: 'nav',
          type: 'text',
        },
      ],
    },
  ],
})
