import { buildConfig } from 'payload'

const groupBy = true

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      groupBy: true,
      fields: [],
    },
  ],
})
