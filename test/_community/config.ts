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
  collections: [
    PostsCollection,
    MediaCollection,
    {
      slug: 'tags',
      fields: [
        {
          name: 'value',
          type: 'text',
        },
      ],
    },
  ],
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

    // delete all tags
    await payload.delete({
      collection: 'tags',
      where: {},
    })

    // Create 12000 tags
    const tagPromises = Array.from({ length: 12000 }, (_, index) => {
      return payload.create({
        collection: 'tags',
        data: {
          value: `Tag ${index + 1}`,
        },
      })
    })

    // Create dev user
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Create 1500 users
    const userPromises = Array.from({ length: 1500 }, (_, index) => {
      return payload.create({
        collection: 'users',
        data: {
          id: (index + 1).toString(),
          email: `user${index + 1}@example.com`,
          password: 'password',
        },
      })
    })

    await Promise.all([...tagPromises, ...userPromises])
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
