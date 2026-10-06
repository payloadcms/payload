import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  config: {
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
    ],
  },
  suite: 'migrations',
})
