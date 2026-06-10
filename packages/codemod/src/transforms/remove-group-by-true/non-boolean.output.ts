import { buildConfig } from 'payload'

const enableGroupBy = true

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      admin: { groupBy: enableGroupBy },
      fields: [],
    },
  ],
})
