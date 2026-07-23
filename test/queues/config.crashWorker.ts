import { sqliteAdapter } from '@payloadcms/db-sqlite'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'

export default buildConfigWithDefaults({
  ...getConfig(),
  db: sqliteAdapter({
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    },
    autoIncrement: true,
    push: false,
  }),
})
