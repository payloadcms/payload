import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
/* eslint-disable no-restricted-exports */
import { defaultPostgresUrl } from '../dbAdapters.js'
import { getConfig, seed } from './getConfig.js'

const config = getConfig()

import { postgresAdapter } from '@payloadcms/db-postgres'

export const databaseAdapter = postgresAdapter({
  pool: {
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl,
  },
  logger: true,
})

export default buildConfigWithDefaults({
  suite: 'database-postgreslogs',
  config: {
    ...config,
    db: databaseAdapter,
  },
  seed,
})
