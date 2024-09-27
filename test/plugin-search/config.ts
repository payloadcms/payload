import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { searchPlugin } from '@payloadcms/plugin-search'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'
import { devUser } from '@test-utils/credentials.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [Users, Pages, Posts],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
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

    await seed(payload)
  },
  plugins: [
    searchPlugin({
      beforeSync: ({ originalDoc, searchDoc }) => {
        return {
          ...searchDoc,
          excerpt: originalDoc?.excerpt || 'This is a fallback excerpt',
          slug: originalDoc.slug,
        }
      },
      collections: ['pages', 'posts'],
      defaultPriorities: {
        pages: 10,
        posts: ({ title }) => (title === 'Hello, world!' ? 30 : 20),
      },
      searchOverrides: {
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'excerpt',
            type: 'textarea',
            admin: {
              position: 'sidebar',
            },
          },
          {
            name: 'slug',
            required: false,
            type: 'text',
            localized: true,
          },
        ],
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
