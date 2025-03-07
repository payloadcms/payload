import type { ConnectOptions } from 'mongoose'
import type { Connect } from 'payload'

import mongoose from 'mongoose'
import { defaultBeginTransaction } from 'payload'

import type { MongooseAdapter } from './index.js'

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

  const connectionOptions: { useFacet: undefined } & ConnectOptions = {
    autoIndex: true,
    ...this.connectOptions,
    useFacet: undefined,
  }

  if (hotReload) {
    connectionOptions.autoIndex = false
  }

  try {
    this.connection = (await mongoose.connect(urlToConnect, connectionOptions)).connection

    // If we are running a replica set with MongoDB Memory Server,
    // wait until the replica set elects a primary before proceeding
    if (this.mongoMemoryServer) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    const client = this.connection.getClient()

    if (!client.options.replicaSet) {
      this.transactionOptions = false
      this.beginTransaction = defaultBeginTransaction()
    }

    if (!this.mongoMemoryServer && !hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info('---- DROPPING DATABASE ----')
        await mongoose.connection.dropDatabase()
        this.payload.logger.info('---- DROPPED DATABASE ----')
      }
    }

    if (this.ensureIndexes) {
      await Promise.all(
        this.payload.config.collections.map(async (coll) => {
          await this.collections[coll.slug]?.ensureIndexes()
        }),
      )
    }

    if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
      await this.migrate({ migrations: this.prodMigrations })
    }
  } catch (err) {
    let msg = `Error: cannot connect to MongoDB.`

    if (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string') {
      msg = `${msg} Details: ${err.message}`
    }

    this.payload.logger.error({
      err,
      msg,
    })
    process.exit(1)
  }
}
