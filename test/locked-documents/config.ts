import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { PagesCollection } from './collections/Pages/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { TestsCollection } from './collections/Tests/index.js'
import { Users } from './collections/Users/index.js'
import { AdminGlobal } from './globals/Admin/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [PagesCollection, PostsCollection, TestsCollection, Users],
  globals: [AdminGlobal, MenuGlobal],
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
