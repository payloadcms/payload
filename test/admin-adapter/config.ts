import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text' }],
    },
  ],
})
