import { D1DatabaseAPI } from '@miniflare/d1'
import { createSQLiteDB } from '@miniflare/shared'
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

dotenv.config()

declare global {
  // Add the custom property to the NodeJS global type
  // eslint-disable-next-line no-var
  var _mongoMemoryServer: MongoMemoryReplSet | undefined
}

/**
 * WARNING: This file MUST export a default function.
 * @link https://jestjs.io/docs/configuration#globalsetup-string
 */
// eslint-disable-next-line no-restricted-exports
export default async () => {
  if (process.env.DATABASE_URI) {
    return
  }
  process.env.NODE_ENV = 'test'
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  if (process.env.PAYLOAD_DATABASE === 'd1' && !global.d1) {
    process.env.PAYLOAD_DROP_DATABASE = 'false'
    console.log('Starting memory D1 db...')
    global.d1 = new D1DatabaseAPI(await createSQLiteDB(':memory'))
  }
  if (
    (!process.env.PAYLOAD_DATABASE ||
      ['cosmosdb', 'documentdb', 'firestore', 'mongodb'].includes(process.env.PAYLOAD_DATABASE)) &&
    !global._mongoMemoryServer
  ) {
    console.log('Starting memory db...')
    const db = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    await db.waitUntilRunning()

    global._mongoMemoryServer = db

    process.env.MONGODB_MEMORY_SERVER_URI = `${global._mongoMemoryServer.getUri()}&retryWrites=true`
    console.log('Started memory db')
  }
}
