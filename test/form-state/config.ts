import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { AutosavePostsCollection } from './collections/Autosave/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import {
  RelatedCollection,
  relatedSlug,
  VirtualFieldsCollection,
} from './collections/VirtualFields/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    PostsCollection,
    AutosavePostsCollection,
    RelatedCollection,
    VirtualFieldsCollection,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  onInit: async (payload) => {
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

    await payload.create({
      collection: relatedSlug,
      data: {
        title: 'Related Title',
        description: 'Related Description',
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
