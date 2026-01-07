/* eslint-disable @typescript-eslint/no-var-requires */
import type { ConnectOptions } from 'mongoose'
import type { Connect } from 'payload/database'

import mongoose from 'mongoose'

import type { MongooseAdapter } from '.'

export const connect: Connect = async function connect(this: MongooseAdapter, payload) {
  if (this.url === false) {
    return
  }

  if (!payload.local && typeof this.url !== 'string') {
    throw new Error('Error: missing MongoDB connection URL.')
  }

  let urlToConnect = this.url
  let successfulConnectionMessage = 'Connected to MongoDB server successfully!'

  const connectionOptions: { useFacet: undefined } & ConnectOptions = {
    autoIndex: true,
    ...this.connectOptions,
    useFacet: undefined,
  }

  if (process.env.NODE_ENV === 'test') {
    if (process.env.PAYLOAD_TEST_MONGO_URL) {
      urlToConnect = process.env.PAYLOAD_TEST_MONGO_URL
    } else {
      connectionOptions.dbName = 'payloadmemory'
      const { MongoMemoryReplSet } = require('mongodb-memory-server')

      this.mongoMemoryServer = await MongoMemoryReplSet.create({
        replSet: {
          args: ['--setParameter', 'maxTransactionLockRequestTimeoutMillis=5000'],
          count: 3,
          dbName: 'payloadmemory',
        },
      })

      await this.mongoMemoryServer.waitUntilRunning()
      urlToConnect = `${this.mongoMemoryServer.getUri()}&retryWrites=true`
      successfulConnectionMessage = 'Connected to in-memory MongoDB server successfully!'
    }
  }

  try {
    this.connection = (await mongoose.connect(urlToConnect, connectionOptions)).connection

    const client = this.connection.getClient()

    if (!client.options.replicaSet) {
      this.transactionOptions = false
      this.beginTransaction = undefined
    }

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      this.payload.logger.info('---- DROPPING DATABASE ----')
      await mongoose.connection.dropDatabase()
      this.payload.logger.info('---- DROPPED DATABASE ----')
    }
    this.payload.logger.info(successfulConnectionMessage)
  } catch (err) {
    this.payload.logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err)
    console.error(err)
    process.exit(1)
  }
}
