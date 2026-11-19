import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * The state after a user turns on `localizeStatus` and before they run the localize-status
 * migration: the schema generator declares the localized status columns.
 */
export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'testMigrationArticles',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      versions: {
        drafts: {
          localizeStatus: true,
        },
      },
    },
  ],
  experimental: {
    localizeStatus: true,
  },
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'localizeStatusEnabled-payload-types.ts'),
  },
})
