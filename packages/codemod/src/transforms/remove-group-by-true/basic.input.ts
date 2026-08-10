import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      admin: {
        groupBy: true,
        useAsTitle: 'title',
      },
      fields: [],
    },
    {
      slug: 'pages',
      admin: { groupBy: false },
      fields: [],
    },
  ],
})
