import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Articles, DraftArticles, Notes, Topics } from './collections/index.js'

export default buildConfigWithDefaults({
  config: { collections: [Topics, Articles, DraftArticles, Notes] },
  suite: 'joins-polymorphic-memberships',
})
