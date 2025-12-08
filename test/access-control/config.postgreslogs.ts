/* eslint-disable no-restricted-exports */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'

const config = getConfig()

import { postgresAdapter } from '@payloadcms/db-postgres'

export const databaseAdapter = postgresAdapter({
  pool: {
    connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
  },
  logger: true,
})

export default buildConfigWithDefaults(
  {
    ...config,
    db: databaseAdapter,
  },
  {
    disableAutoLogin: true,
  },
)
