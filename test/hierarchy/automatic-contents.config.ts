import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { automaticContentsCollections } from './collections/automaticContents.js'

export default buildConfigWithDefaults({
  config: { collections: automaticContentsCollections },
  suite: 'hierarchy',
})
