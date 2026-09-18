import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { EmailsCollection } from './collections/Emails.js'
import { PostsCollection } from './collections/Posts.js'
import { Users } from './collections/Users.js'

export default buildConfigWithDefaults({
  suite: 'sdk',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      Users,
      PostsCollection,
      EmailsCollection,
      {
        slug: 'media',
        access: { create: () => true, read: () => true, update: () => true },
        fields: [],
        upload: { staticDir: path.resolve(dirname, './media') },
        versions: false,
      },
    ],
    globals: [
      {
        slug: 'global',
        fields: [{ name: 'text', type: 'text' }],
        versions: true,
      },
    ],
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'es', 'de'],
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
  },
})
