import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { Pages } from './mongodb-migration/collections/Pages.js'
import { Uploads } from './mongodb-migration/collections/Uploads.js'
import { pagesSlug, settingsSlug, uploadsSlug } from './mongodb-migration/shared.js'

const config = await buildConfigWithDefaults({
  config: {
    collections: [Pages, Uploads],
    db: {
      ...databaseAdapter,
      init: (args) => {
        const adapter = databaseAdapter.init(args)

        if (adapter.name === 'mongoose') {
          const mongoAdapter = adapter as MongooseAdapter

          mongoAdapter.connectOptions = { ...mongoAdapter.connectOptions, autoIndex: false }
          mongoAdapter.ensureIndexes = false
        }

        return adapter
      },
    },
    globals: [{ slug: settingsSlug, versions: true, fields: [{ name: '_branch', type: 'text' }] }],
    localization: { defaultLocale: 'en', locales: ['en', 'de'] },
  },
  disableMCP: true,
  suite: 'branching',
})

// The MongoDB layer precedes core branch-field injection and branch lifecycle registration.
config.branching = {
  branchableCollections: new Set([pagesSlug, uploadsSlug]),
  branchableGlobals: new Set([settingsSlug]),
  enabled: true,
  validate: () => ({ errors: [], valid: true }),
}

export default config
