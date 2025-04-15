import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import AutosavePosts from './collections/Autosave.js'
import AutosaveWithValidate from './collections/AutosaveWithValidate.js'
import CustomIDs from './collections/CustomIDs.js'
import { Diff } from './collections/Diff/index.js'
import DisablePublish from './collections/DisablePublish.js'
import DraftPosts from './collections/Drafts.js'
import DraftWithMax from './collections/DraftsWithMax.js'
import DraftsWithValidate from './collections/DraftsWithValidate.js'
import LocalizedPosts from './collections/Localized.js'
import { Media } from './collections/Media.js'
import Posts from './collections/Posts.js'
import { TextCollection } from './collections/Text.js'
import VersionPosts from './collections/Versions.js'
import AutosaveGlobal from './globals/Autosave.js'
import DisablePublishGlobal from './globals/DisablePublish.js'
import DraftGlobal from './globals/Draft.js'
import DraftWithMaxGlobal from './globals/DraftWithMax.js'
import LocalizedGlobal from './globals/LocalizedGlobal.js'
import { seed } from './seed.js'

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
    AutosaveWithValidate,
    DraftPosts,
    DraftWithMax,
    DraftsWithValidate,
    LocalizedPosts,
    VersionPosts,
    CustomIDs,
    Diff,
    TextCollection,
    Media,
  ],
  globals: [AutosaveGlobal, DraftGlobal, DraftWithMaxGlobal, DisablePublishGlobal, LocalizedGlobal],
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
