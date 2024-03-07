/* eslint-disable @typescript-eslint/no-var-requires */
import type { ConnectOptions } from 'mongoose'
import type { Connect } from 'payload/database'

import mongoose from 'mongoose'

import type { MongooseAdapter } from './index.d.ts'

export const connect: Connect = async function connect(
  this: MongooseAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  if (this.url === false) {
    return
  }

  if (typeof this.url !== 'string') {
    throw new Error('Error: missing MongoDB connection URL.')
  }

  const urlToConnect = this.url

  const connectionOptions: ConnectOptions & { useFacet: undefined } = {
    autoIndex: true,
    ...this.connectOptions,
    useFacet: undefined,
  }

  if (hotReload) connectionOptions.autoIndex = false

  try {
    this.connection = (await mongoose.connect(urlToConnect, connectionOptions)).connection

    const client = this.connection.getClient()

    if (!client.options.replicaSet) {
      this.transactionOptions = false
      this.beginTransaction = undefined
    }

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info('---- DROPPING DATABASE ----')
        await mongoose.connection.dropDatabase()
        this.payload.logger.info('---- DROPPED DATABASE ----')
      }
    }
  } catch (err) {
    this.payload.logger.error(`Error: cannot connect to MongoDB. Details: ${err.message}`, err)
    process.exit(1)
  }
}
