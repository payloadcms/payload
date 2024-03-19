import type { SanitizedConfig } from 'payload/config'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

import Logger from '../packages/payload/src/utilities/logger.js'

export const startMemoryDB = async (
  configPromise: Promise<SanitizedConfig>,
): Promise<SanitizedConfig> => {
  const config = await configPromise

  process.env.NODE_OPTIONS = '--no-deprecation'

  const logger = Logger()

  switch (process.env.PAYLOAD_DATABASE) {
    case 'postgres':
    case 'supabase':
    case 'postgres-uuid': {
      return config
    }

    default: {
      if (!process.env.CI) logger.info('---- CONNECTING TO MEMORY DB ----')
      const db = await MongoMemoryReplSet.create({
        replSet: {
          count: 3,
          dbName: 'payloadmemory',
        },
      })

      config.db = mongooseAdapter({
        mongoMemoryServer: db,
        url: db.getUri(),
      })

      return config
    }
  }
}
