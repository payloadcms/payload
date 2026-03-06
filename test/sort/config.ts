import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { DefaultSortCollection } from './collections/DefaultSort/index.js'
import { DraftsCollection } from './collections/Drafts/index.js'
import { LocalizedCollection } from './collections/Localized/index.js'
import { NonUniqueSortCollection } from './collections/NonUniqueSort/index.js'
import { OrderableCollection } from './collections/Orderable/index.js'
import { OrderableJoinCollection } from './collections/OrderableJoin/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { seed, seedSortable } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    PostsCollection,
    DraftsCollection,
    DefaultSortCollection,
    NonUniqueSortCollection,
    LocalizedCollection,
    OrderableCollection,
    OrderableJoinCollection,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [
    {
      path: '/seed',
      method: 'post',
      handler: async (req) => {
        await seedSortable(req.payload)

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      },
    },
  ],
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  localization: {
    locales: ['en', 'nb'],
    defaultLocale: 'en',
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
