import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Categories } from './collections/Categories.js'
import { Posts } from './collections/Posts.js'

export default buildConfigWithDefaults({
  collections: [{ slug: 'users', auth: true, fields: [] }, Posts, Categories],
  onInit: async (payload) => {
    const { seed } = await import('./seed.js')
    await seed(payload)
  },
})
