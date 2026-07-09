import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      admin: {
        useAsTitle: 'title',
      },
      fields: [],
    },
    {
      slug: 'pages',
      admin: { },
      fields: [],
    },
  ],
})
