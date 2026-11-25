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
    localization: {
      defaultLocale: 'en',
      locales: [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Spanish' },
      ],
    },
  },
  suite: 'joins-polymorphic-memberships',
})
