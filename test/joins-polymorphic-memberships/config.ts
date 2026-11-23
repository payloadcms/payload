import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Articles, Notes, Topics } from './collections/index.js'

export default buildConfigWithDefaults({
  config: { collections: [Topics, Articles, Notes] },
  suite: 'joins-polymorphic-memberships',
})
