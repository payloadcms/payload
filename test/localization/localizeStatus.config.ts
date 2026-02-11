import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'testMigrationPosts',
      fields: [
        {
          name: 'title',
          type: 'text',
          // NOT localized - so no locales table for versions will be created
        },
      ],
      versions: {
        drafts: true, // This adds _status field to versions
        // localizeStatus: false by default - creates OLD schema
      },
    },
    {
      slug: 'testMigrationArticles',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true, // This WILL create a locales table
        },
      ],
      versions: {
        drafts: true,
        // localizeStatus: false by default - creates OLD schema
      },
    },
    {
      slug: 'testNoVersions',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      // NO versions config - migration should skip this collection
    },
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'localizeStatus-payload-types.ts'),
  },
})
