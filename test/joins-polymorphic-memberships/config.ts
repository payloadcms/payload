import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  Articles,
  DraftArticles,
  Media,
  MediaArticles,
  MediaNotes,
  Notes,
  SectionArticles,
  Topics,
} from './collections/index.js'

export default buildConfigWithDefaults({
  config: {
    collections: [
      Topics,
      Articles,
      DraftArticles,
      Notes,
      Media,
      MediaArticles,
      MediaNotes,
      SectionArticles,
    ],
  },
  suite: 'joins-polymorphic-memberships',
})
