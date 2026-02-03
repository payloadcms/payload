import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { searchPlugin } from '@payloadcms/plugin-search'
import { randomUUID } from 'node:crypto'

import type { Config } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '@tools/test-utils/shared'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [
    Users,
    Pages,
    Posts,
    {
      slug: 'custom-ids-1',
      fields: [{ type: 'text', name: 'id' }],
    },
    {
      slug: 'custom-ids-2',
      fields: [{ type: 'text', name: 'id' }],
    },
    {
      slug: 'filtered-locales',
      fields: [
        {
          type: 'text',
          name: 'title',
          localized: true,
        },
        {
          type: 'checkbox',
          name: 'syncEnglishOnly',
        },
      ],
    },
  ],
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
    searchPlugin<Config>({
      beforeSync: ({ originalDoc, searchDoc }) => {
        return {
          ...searchDoc,
          excerpt: originalDoc?.excerpt || 'This is a fallback excerpt',
          slug: originalDoc.slug,
        }
      },
      collections: ['pages', 'posts', 'custom-ids-1', 'custom-ids-2', 'filtered-locales'],
      skipSync: ({ locale, doc, collectionSlug }) => {
        if (collectionSlug === 'filtered-locales' && doc.syncEnglishOnly) {
          return locale !== 'en'
        }
        return false
      },
      defaultPriorities: {
        pages: 10,
        posts: ({ title }) => (title === 'Hello, world!' ? 30 : 20),
      },
      searchOverrides: {
        access: {
          // Used for int test
          delete: ({ req: { user } }) => user?.email === devUser.email,
        },
        fields: ({ defaultFields }) => [
          ...defaultFields,
          // This is necessary to test whether search docs were deleted or not with SQLite
          // Because IDs in SQLite, apparently, aren't unique if we count deleted rows without AUTOINCREMENT option
          // Thus we have a custom UUID field.
          {
            name: 'id',
            type: 'text',
            hooks: {
              beforeChange: [
                ({ operation }) => {
                  if (operation === 'create') {
                    return randomUUID()
                  }
                },
              ],
            },
          },
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
