import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import AutosavePosts from './collections/Autosave'
import DisablePublish from './collections/DisablePublish'
import DraftPosts from './collections/Drafts'
import Posts from './collections/Posts'
import VersionPosts from './collections/Versions'
import AutosaveGlobal from './globals/Autosave'
import DisablePublishGlobal from './globals/DisablePublish'
import DraftGlobal from './globals/Draft'
import { clearAndSeedEverything } from './seed'

export default buildConfigWithDefaults({
  collections: [DisablePublish, Posts, AutosavePosts, DraftPosts, VersionPosts],
  globals: [AutosaveGlobal, DraftGlobal, DisablePublishGlobal],
  indexSortableFields: true,
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await clearAndSeedEverything(payload)
  },
})
