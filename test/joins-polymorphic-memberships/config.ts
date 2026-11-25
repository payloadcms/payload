import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  Articles,
  DraftArticles,
  Media,
  MediaArticles,
  MediaNotes,
  Notes,
  Topics,
} from './collections/index.js'

export default buildConfigWithDefaults({
  config: {
    collections: [Topics, Articles, DraftArticles, Notes, Media, MediaArticles, MediaNotes],
  },
  suite: 'joins-polymorphic-memberships',
})
