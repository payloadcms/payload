import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { MaxPosts } from './collections/max-posts.js'

export default buildConfigWithDefaults({
  config: { collections: [MaxPosts] },
  suite: 'version-selector-max-versions',
})
