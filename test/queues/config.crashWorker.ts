import { sqliteAdapter } from '@payloadcms/db-sqlite'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'

const idType =
  process.env.PAYLOAD_DATABASE === 'sqlite-uuid'
    ? 'uuid'
    : process.env.PAYLOAD_DATABASE === 'sqlite-uuidv7'
      ? 'uuidv7'
      : undefined

export default buildConfigWithDefaults({
  ...getConfig(),
  db: sqliteAdapter({
    client: {
      url: process.env.SQLITE_URL || process.env.DATABASE_URL || 'file:./payload.db',
    },
    ...(idType ? { idType } : { autoIncrement: true }),
    push: false,
  }),
})
