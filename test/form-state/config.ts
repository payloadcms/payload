import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { AutosavePostsCollection } from './collections/Autosave/index.js'
import { ConditionsCollection } from './collections/Conditions/index.js'
import { DraftPostsCollection } from './collections/DraftPosts/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'form-state',
  config: {
    admin: {
      components: {
        views: {
          ClientValidation: {
            Component: './components/ClientValidationView/index.js#ClientValidationView',
            path: '/client-validation',
          },
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      PostsCollection,
      AutosavePostsCollection,
      ConditionsCollection,
      DraftPostsCollection,
    ],
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
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
      },
      overrideAccess: true,
    })
  },
})
