/* eslint-disable payload/no-relative-monorepo-imports -- Exercise private write admission without localization. */
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { fileURLToPath } from 'node:url'

import { registerBranchQueryStorage } from '../../packages/payload/src/versions/branches/queries/registerBranchQueryStorage.js'
import { registerBranchStorage } from '../../packages/payload/src/versions/branches/storage/registerBranchStorage.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { FractionalIDs } from './collections/FractionalIDs/index.js'
import { ScalarArticles } from './collections/ScalarArticles/index.js'
import { settingsSlug } from './slugs.js'

const selectedDatabaseAdapter = process.env.PAYLOAD_DATABASE?.startsWith('sqlite')
  ? sqliteAdapter({
      autoIncrement: true,
      client: { url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db' },
      idType:
        process.env.PAYLOAD_DATABASE === 'sqlite-uuid'
          ? 'uuid'
          : process.env.PAYLOAD_DATABASE === 'sqlite-uuidv7'
            ? 'uuidv7'
            : 'number',
      transactionOptions: {},
    })
  : databaseAdapter

export default buildConfigWithDefaults({
  suite: 'version-branches',
  disableMCP: true,
  config: {
    db: selectedDatabaseAdapter,
    localization: false,
    ...registerBranchQueryStorage(
      registerBranchStorage({
        collections: [
          {
            ...FractionalIDs,
            versions: { drafts: { autosave: true } },
            fields: [
              { name: 'id', type: 'number', required: true },
              { name: 'title', type: 'text' },
            ],
          },
          { ...ScalarArticles, versions: { drafts: { autosave: true }, maxPerDoc: 3 } },
        ],
        globals: [
          {
            slug: settingsSlug,
            access: { read: () => true, update: () => true },
            fields: [{ name: 'title', type: 'text' }],
            versions: { drafts: { autosave: true } },
          },
        ],
        versionIDType: selectedDatabaseAdapter.defaultIDType,
      }),
    ),
    typescript: {
      outputFile: fileURLToPath(new URL('./autosave-scalar-types.ts', import.meta.url)),
    },
  },
})
