import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import AutosavePosts from './collections/Autosave'
import DraftPosts from './collections/Drafts'
import Posts from './collections/Posts'
import VersionPosts from './collections/Versions'
import AutosaveGlobal from './globals/Autosave'
import DraftGlobal from './globals/Draft'
import { seed } from './seed'

export default buildConfigWithDefaults({
  collections: [Posts, AutosavePosts, DraftPosts, VersionPosts],
  globals: [AutosaveGlobal, DraftGlobal],
  indexSortableFields: true,
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: seed,
})
