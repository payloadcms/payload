import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { fileURLToPath } from 'node:url'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Register internal head storage only in the experimental integration fixture.
import { registerBranchStorage } from '../../packages/payload/src/versions/branches/storage/registerBranchStorage.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { Articles } from './collections/Articles/index.js'
import { ProtectedArticles } from './collections/ProtectedArticles/index.js'
import { Settings } from './globals/Settings/index.js'

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
  : process.env.PAYLOAD_BRANCH_HEAD_WRAPPER === 'vercel-postgres'
    ? vercelPostgresAdapter({ pool: { connectionString: process.env.POSTGRES_URL } })
    : databaseAdapter

export default buildConfigWithDefaults({
  config: {
    db: selectedDatabaseAdapter,
    ...registerBranchStorage({
      collections: [Articles, ProtectedArticles],
      globals: [Settings],
      versionIDType: selectedDatabaseAdapter.defaultIDType,
    }),
    jobs: { deleteJobOnComplete: false },
    localization: { defaultLocale: 'en', fallback: false, locales: ['en', 'fr'] },
    typescript: { outputFile: fileURLToPath(new URL('./payload-types.ts', import.meta.url)) },
  },
  disableMCP: true,
  suite: 'version-branches',
})
