import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { generateCollections } from './collections/index.js'

export default buildConfigWithDefaults({
  collections: [
    ...generateCollections(30),
    {
      slug: 'users',
      auth: true,
      fields: [{ name: 'name', type: 'text' }],
    },
  ],
  globals: Array.from({ length: 5 }, (_, i) => ({
    slug: `global-${i}`,
    fields: [{ name: 'title', type: 'text' }],
  })),
})
