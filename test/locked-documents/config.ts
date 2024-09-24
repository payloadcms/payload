import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'
import { devUser, regularUser } from '../credentials.js'
import { PagesCollection, pagesSlug } from './collections/Pages/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { Users } from './collections/Users/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [PagesCollection, PostsCollection, Users],
  globals: [MenuGlobal],
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
          name: 'Admin',
        },
      })

      await payload.create({
        collection: 'users',
        data: {
          email: regularUser.email,
          password: regularUser.password,
          name: 'Dev',
        },
      })

      await payload.create({
        collection: pagesSlug,
        data: {
          text: 'example page',
        },
      })

      await payload.create({
        collection: postsSlug,
        data: {
          text: 'example post',
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
