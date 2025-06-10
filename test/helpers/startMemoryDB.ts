import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
dotenv.config()

declare global {
  // Add the custom property to the NodeJS global type
  // eslint-disable-next-line no-var
  var _mongoMemoryServer: MongoMemoryReplSet | undefined
}

// eslint-disable-next-line no-restricted-exports
export default async () => {
  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  if (
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

    await db.waitUntilRunning()

    global._mongoMemoryServer = db

    process.env.MONGODB_MEMORY_SERVER_URI = `${global._mongoMemoryServer.getUri()}&retryWrites=true`
    console.log('Started memory db')
  }
}
