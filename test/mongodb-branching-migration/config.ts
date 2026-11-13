import { mongooseAdapter } from '@payloadcms/db-mongodb'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Pages } from './collections/Pages.js'
import { Uploads } from './collections/Uploads.js'
import { pagesSlug, settingsSlug, uploadsSlug } from './shared.js'

const config = await buildConfigWithDefaults({
  config: {
    collections: [Pages, Uploads],
    db: mongooseAdapter({
      connectOptions: { autoIndex: false },
      ensureIndexes: false,
      url:
        process.env.MONGODB_URL ||
        process.env.DATABASE_URL ||
        'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
    }),
    globals: [{ slug: settingsSlug, versions: true, fields: [{ name: '_branch', type: 'text' }] }],
    localization: { defaultLocale: 'en', locales: ['en', 'de'] },
  },
  disableMCP: true,
  suite: 'mongodb-branching-migration',
})

// The MongoDB layer precedes core branch-field injection and branch lifecycle registration.
config.branching = {
  branchableCollections: new Set([pagesSlug, uploadsSlug]),
  branchableGlobals: new Set([settingsSlug]),
  enabled: true,
  validate: () => ({ errors: [], valid: true }),
}

export default config
