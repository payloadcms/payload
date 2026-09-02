import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'admin-bar',
  config: {
    // ...extend config here
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [PostsCollection, MediaCollection],
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
        title: 'example post',
      },
    })
  },
})
