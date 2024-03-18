import { MongoMemoryReplSet } from 'mongodb-memory-server'

import type { SanitizedConfig } from '../packages/payload/src/config/types.js'

import { mongooseAdapter } from '../packages/db-mongodb/src/index.js'
import Logger from '../packages/payload/src/utilities/logger.js'

export const startMemoryDB = async (
  configPromise: Promise<SanitizedConfig>,
): Promise<SanitizedConfig> => {
  const config = await configPromise

  process.env.NODE_OPTIONS = '--no-deprecation'

  const logger = Logger()
  logger.info('---- CONNECTING TO MEMORY DB ----')

  switch (process.env.PAYLOAD_DATABASE) {
    case 'postgres':
    case 'supabase':
    case 'postgres-uuid': {
      return config
    }

    default: {
      const db = await MongoMemoryReplSet.create({
        replSet: {
          count: 3,
          dbName: 'payloadmemory',
        },
      })

      config.db = mongooseAdapter({
        url: db.getUri(),
        mongoMemoryServer: db,
      })

      return config
    }
  }
}
