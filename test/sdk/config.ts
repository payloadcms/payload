import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { PostsCollection } from './collections/Posts.js'
import { Users } from './collections/Users.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    PostsCollection,
    {
      access: { create: () => true, read: () => true, update: () => true },
      slug: 'media',
      upload: { staticDir: path.resolve(dirname, './media') },
      fields: [],
    },
  ],
  globals: [
    {
      slug: 'global',
      fields: [{ type: 'text', name: 'text' }],
      versions: true,
    },
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
