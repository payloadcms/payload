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
      authorship: false,
    },
    {
      slug: 'media',
      fields: [],
      upload: true,
      authorship: false,
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
      authorship: false,
    },
  ],
})
