import { MongoMemoryReplSet } from 'mongodb-memory-server'

export const startMemoryDB = async () => {
  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_OPTIONS = '--no-deprecation'

  if (
    (!process.env.PAYLOAD_DATABASE || process.env.PAYLOAD_DATABASE === 'mongoose') &&
    !global._mongoMemoryServer
  ) {
    global._mongoMemoryServer = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.MONGODB_MEMORY_SERVER_URI = global._mongoMemoryServer.getUri()
  }
}
