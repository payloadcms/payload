import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Posts } from './collections/posts.js'

export default buildConfigWithDefaults({
  config: { collections: [{ ...Posts, orderable: true }] },
  suite: 'version-selector-orderable',
})
