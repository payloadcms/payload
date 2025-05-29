import { D1DatabaseAPI } from '@miniflare/d1'
import { createSQLiteDB } from '@miniflare/shared'
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
dotenv.config()

// eslint-disable-next-line no-restricted-exports
export default async () => {
  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  if (process.env.PAYLOAD_DATABASE === 'd1' && !global.d1) {
    process.env.PAYLOAD_DROP_DATABASE = 'false'
    console.log('Starting memory D1 db...')
    global.d1 = new D1DatabaseAPI(await createSQLiteDB(':memory'))
  } else if (
    (!process.env.PAYLOAD_DATABASE || process.env.PAYLOAD_DATABASE === 'mongodb') &&
    !global._mongoMemoryServer
  ) {
    console.log('Starting memory db...')
    const db = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    global._mongoMemoryServer = db

    process.env.MONGODB_MEMORY_SERVER_URI = `${global._mongoMemoryServer.getUri()}&retryWrites=true`
  }
}
