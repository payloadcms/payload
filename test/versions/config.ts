import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import AutosavePosts from './collections/Autosave.js'
import AutosaveWithDraftButtonPosts from './collections/AutosaveWithDraftButton.js'
import AutosaveWithDraftValidate from './collections/AutosaveWithDraftValidate.js'
import AutosaveWithMultiSelectPosts from './collections/AutosaveWithMultiSelect.js'
import CustomIDs from './collections/CustomIDs.js'
import { Diff } from './collections/Diff/index.js'
import DisablePublish from './collections/DisablePublish.js'
import DraftPosts from './collections/Drafts.js'
import DraftsNoReadVersions from './collections/DraftsNoReadVersions.js'
import DraftWithChangeHook from './collections/DraftsWithChangeHook.js'
import DraftWithMax from './collections/DraftsWithMax.js'
import DraftsWithValidate from './collections/DraftsWithValidate.js'
import ErrorOnUnpublish from './collections/ErrorOnUnpublish.js'
import LocalizedPosts from './collections/Localized.js'
import { Media } from './collections/Media.js'
import { Media2 } from './collections/Media2.js'
import Posts from './collections/Posts.js'
import { TextCollection } from './collections/Text.js'
import VersionPosts from './collections/Versions.js'
import AutosaveGlobal from './globals/Autosave.js'
import AutosaveWithDraftButtonGlobal from './globals/AutosaveWithDraftButton.js'
import DisablePublishGlobal from './globals/DisablePublish.js'
import DraftGlobal from './globals/Draft.js'
import DraftUnlimitedGlobal from './globals/DraftUnlimited.js'
import DraftWithMaxGlobal from './globals/DraftWithMax.js'
import LocalizedGlobal from './globals/LocalizedGlobal.js'
import { MaxVersions } from './globals/MaxVersions.js'
import { seed } from './seed.js'
import { BASE_PATH } from './shared.js'
process.env.NEXT_BASE_PATH = BASE_PATH
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // The autosave test uses this format in order to compare timestamps in the UI
    dateFormat: 'MMMM do yyyy, h:mm:ss a',
  },
  collections: [
    DisablePublish,
    Posts,
    AutosavePosts,
    AutosaveWithDraftButtonPosts,
    AutosaveWithMultiSelectPosts,
    AutosaveWithDraftValidate,
    DraftPosts,
    DraftsNoReadVersions,
    DraftWithMax,
    DraftWithChangeHook,
    DraftsWithValidate,
    ErrorOnUnpublish,
    LocalizedPosts,
    VersionPosts,
    CustomIDs,
    Diff,
    TextCollection,
    Media,
    Media2,
  ],
  globals: [
    AutosaveGlobal,
    AutosaveWithDraftButtonGlobal,
    DraftGlobal,
    DraftWithMaxGlobal,
    DisablePublishGlobal,
    LocalizedGlobal,
    MaxVersions,
    DraftUnlimitedGlobal,
  ],
  indexSortableFields: true,
  localization: {
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'es',
        label: {
          en: 'Spanish',
          es: 'Español',
          de: 'Spanisch',
        },
      },
      {
        code: 'de',
        label: {
          en: 'German',
          es: 'Alemán',
          de: 'Deutsch',
        },
      },
    ],
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
