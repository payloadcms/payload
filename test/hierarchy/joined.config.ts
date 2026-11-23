import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { joinedCollections } from './collections/joined.js'

export default buildConfigWithDefaults({
  config: { collections: joinedCollections },
  suite: 'hierarchy',
})
