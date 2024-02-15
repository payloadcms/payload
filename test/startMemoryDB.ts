import getPort from 'get-port'
import { MongoMemoryServer } from 'mongodb-memory-server'

import type { SanitizedConfig } from '../packages/payload/src/config/types'

import { mongooseAdapter } from '../packages/db-mongodb/src'

export const startMemoryDB = async (
  configPromise: Promise<SanitizedConfig>,
): Promise<SanitizedConfig> => {
  const config = await configPromise

  switch (process.env.PAYLOAD_DATABASE) {
    case 'postgres':
    case 'supabase':
    case 'postgres-uuid': {
      return config
    }

    default: {
      const port = await getPort()
      const db = await MongoMemoryServer.create({
        instance: {
          dbName: 'payloadmemory',
          port,
        },
      })

      config.db = mongooseAdapter({ url: db.getUri() })

      return config
    }
  }
}
