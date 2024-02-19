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

  const urlToConnect = this.url
  const successfulConnectionMessage = 'Connected to MongoDB server successfully!'

  const connectionOptions: ConnectOptions & { useFacet: undefined } = {
    autoIndex: true,
    ...this.connectOptions,
    useFacet: undefined,
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
    process.exit(1)
  }
}
