import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Articles, DraftArticles, Notes, SectionArticles, Topics } from './collections/index.js'

export default buildConfigWithDefaults({
  config: { collections: [Topics, Articles, DraftArticles, Notes, SectionArticles] },
  suite: 'joins-polymorphic-memberships',
})
