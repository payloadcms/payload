/* eslint-disable payload/no-relative-monorepo-imports -- Experimental benchmark uses the same internal registration as the integration fixture. */
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { fileURLToPath } from 'node:url'

import { registerBranchQueryStorage } from '../../../packages/payload/src/versions/branches/queries/registerBranchQueryStorage.js'
import { registerBranchStorage } from '../../../packages/payload/src/versions/branches/storage/registerBranchStorage.js'
import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { databaseAdapter } from '../../databaseAdapter.js'
import { PerformanceArticles } from './collections/Articles.js'
import { getPerformanceScenario, performanceLocales } from './scenarios.js'

const scenario = getPerformanceScenario()
const selectedURL = process.env.PAYLOAD_DATABASE?.startsWith('sqlite')
  ? process.env.SQLITE_URL
  : process.env.PAYLOAD_DATABASE === 'postgres'
    ? process.env.POSTGRES_URL
    : process.env.MONGODB_URL
const isDedicatedDatabase = process.env.PAYLOAD_DATABASE?.startsWith('sqlite')
  ? selectedURL?.startsWith('file:/private/tmp/payload-branch-perf')
  : selectedURL && new URL(selectedURL).pathname === '/payload_branch_perf'

if (process.env.PAYLOAD_BRANCH_PERF !== 'true' || !isDedicatedDatabase) {
  throw new Error(
    'Opt-in performance fixtures require the dedicated payload_branch_perf database or /private/tmp/payload-branch-perf SQLite file.',
  )
}
const selectedAdapter = process.env.PAYLOAD_DATABASE?.startsWith('sqlite')
  ? sqliteAdapter({ client: { url: process.env.SQLITE_URL! }, transactionOptions: {} })
  : process.env.PAYLOAD_DATABASE === 'mongodb'
    ? mongooseAdapter({
        url: process.env.MONGODB_URL!,
        ensureIndexes: true,
        connectOptions: { monitorCommands: true },
      })
    : databaseAdapter

export default buildConfigWithDefaults({
  config: {
    db: selectedAdapter,
    ...registerBranchQueryStorage(
      registerBranchStorage({
        collections: [PerformanceArticles],
        globals: [],
        versionIDType: selectedAdapter.defaultIDType,
      }),
    ),
    localization: {
      defaultLocale: 'en',
      fallback: false,
      locales: performanceLocales.slice(0, scenario.locales),
    },
    typescript: {
      autoGenerate: false,
      outputFile: fileURLToPath(new URL('./payload-types.ts', import.meta.url)),
    },
  },
  disableMCP: true,
  suite: 'version-branches/performance',
})
