import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { searchPlugin } from '@payloadcms/plugin-search'
import { randomUUID } from 'node:crypto'

import type { Config } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  suite: 'plugin-search',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      Users,
      Pages,
      Posts,
      {
        slug: 'custom-ids-1',
        fields: [{ name: 'id', type: 'text' }],
        versions: false,
      },
      {
        slug: 'custom-ids-2',
        fields: [{ name: 'id', type: 'text' }],
        versions: false,
      },
      {
        slug: 'filtered-locales',
        fields: [
          {
            name: 'title',
            type: 'text',
            localized: true,
          },
          {
            name: 'syncEnglishOnly',
            type: 'checkbox',
          },
        ],
        versions: false,
      },
    ],
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'es', 'de'],
    },
    plugins: [
      searchPlugin<Config>({
        beforeSync: ({ originalDoc, searchDoc }) => {
          return {
            ...searchDoc,
            slug: originalDoc.slug,
            excerpt: originalDoc?.excerpt || 'This is a fallback excerpt',
          }
        },
        collections: ['pages', 'posts', 'custom-ids-1', 'custom-ids-2', 'filtered-locales'],
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
              type: 'text',
              localized: true,
              required: false,
            },
          ],
        },
        skipSync: ({ collectionSlug, doc, locale }) => {
          if (collectionSlug === 'filtered-locales' && doc.syncEnglishOnly) {
            return locale !== 'en'
          }
          return false
        },
      }),
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
    })

    await seed(payload)
  },
})
