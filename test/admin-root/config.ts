import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
import { adminRoute } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'admin-root',
  config: {
    admin: {
      autoLogin: {
        email: devUser.email,
        password: devUser.password,
        prefillOnly: true,
      },
      components: {
        views: {
          CustomDefaultView: {
            Component: '/CustomView/index.js#CustomView',
            path: '/custom-view',
          },
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
      theme: 'dark',
    },
    collections: [PostsCollection],
    cors: [`http://localhost:${process.env.PORT || 3000}`, 'http://localhost:3001'],
    globals: [MenuGlobal],
    routes: {
      admin: adminRoute,
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      collection: postsSlug,
      data: {
        text: 'example post',
      },
    })
  },
})
