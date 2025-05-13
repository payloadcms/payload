import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Collection1 } from './collections/Collection1/index.js'
import { Collection2 } from './collections/Collection2/index.js'
import { RelationshipFilterFalse } from './collections/FilterFalse/index.js'
import { RelationshipFilterTrue } from './collections/FilterTrue/index.js'
import { MixedMedia } from './collections/MixedMedia/index.js'
import { Podcast } from './collections/Podcast/index.js'
import { Relation1 } from './collections/Relation1/index.js'
import { Relation2 } from './collections/Relation2/index.js'
import { Relationship } from './collections/Relationship/index.js'
import { RelationWithTitle } from './collections/RelationWithTitle/index.js'
import { Restricted } from './collections/Restricted/index.js'
import { RelationshipUpdatedExternally } from './collections/UpdatedExternally/index.js'
import { Versions } from './collections/Versions/index.js'
import { Video } from './collections/Video/index.js'
import { clearAndSeedEverything } from './seed.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Relationship,
    RelationshipFilterFalse,
    RelationshipFilterTrue,
    Relation1,
    Relation2,
    Restricted,
    RelationWithTitle,
    RelationshipUpdatedExternally,
    Collection1,
    Collection2,
    Video,
    Podcast,
    MixedMedia,
    Versions,
  ],
  localization: {
    locales: ['en'],
    defaultLocale: 'en',
    fallback: true,
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await clearAndSeedEverything(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
