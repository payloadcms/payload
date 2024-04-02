import type { DatabaseAdapterObj } from 'payload/database'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

let cached: {
  adapter: DatabaseAdapterObj | null
  promise: Promise<DatabaseAdapterObj> | null
} = global._cachedDBAdapter

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._cachedDBAdapter = {
    promise: null,
    adapter: null,
  }
}

export const getDBAdapter = async (): Promise<DatabaseAdapterObj> => {
  if (!process.env.PAYLOAD_DATABASE || process.env.PAYLOAD_DATABASE === 'mongodb') {
    if (process.env.JEST_WORKER_ID || process.env.PW_TS_ESM_LOADER_ON) {
      console.log('Good: Using in-memory MongoDB for tests')
      if (cached.adapter) {
        console.log('MDB: Cached')
        return cached.adapter
      }
      if (!cached.promise) {
        console.log('MDB: Creating')
        cached.promise = MongoMemoryReplSet.create({
          replSet: {
            count: 3,
            dbName: 'payloadmemory',
          },
        }).then((server) => {
          const url = server.getUri()
          return mongooseAdapter({
            mongoMemoryServer: server,
            url,
          })
        })
      }
      console.log('MDB: Awaiting')

      cached.adapter = await cached.promise

      return cached.adapter
    } else {
      console.log('Bad1!!')
    }
  } else {
    console.log('Bad2!!')
  }
  return cached.adapter
}
