import { MongoMemoryReplSet } from 'mongodb-memory-server'

export const startMemoryDB = async () => {
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
