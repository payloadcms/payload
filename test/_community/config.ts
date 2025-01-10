import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [PostsCollection, MediaCollection],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  globals: [
    // ...add more globals here
    MenuGlobal,
  ],
  db: mongooseAdapter({
    url: 'mongodb://127.0.0.1/payloadtests',
    connectOptions: {
      dbName: 'payload-1',
      useFacet: false, // not supported in DocumentDB
    },
    disableIndexHints: true, // not supported in DocumentDB
    autoPluralization: false,
  }),
  onInit: async (payload) => {
    // delete all users
    await payload.delete({
      collection: 'users',
      where: {},
    })

    // Create dev user
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Create 100 users
    const userPromises = Array.from({ length: 100 }, (_, i) => {
      const index = (i + 1).toString().padStart(3, '0')
      return payload.create({
        collection: 'users',
        data: {
          id: index,
          email: `user${index}@example.com`,
          password: 'password',
        },
      })
    })

    await Promise.all([...userPromises])
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
