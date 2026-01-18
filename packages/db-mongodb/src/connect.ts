import type { ConnectOptions } from 'mongoose'
import type { Connect, Migration } from '@ruya.sa/payload'

import mongoose from 'mongoose'
import { defaultBeginTransaction } from '@ruya.sa/payload'

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
    if (!this.connection) {
      this.connection = await mongoose.createConnection(urlToConnect, connectionOptions).asPromise()
      if (this.afterCreateConnection) {
        await this.afterCreateConnection(this)
      }
    }

    await this.connection.openUri(urlToConnect, connectionOptions)

    if (this.afterOpenConnection) {
      await this.afterOpenConnection(this)
    }

    if (this.useAlternativeDropDatabase) {
      if (this.connection.db) {
        // Firestore doesn't support dropDatabase, so we monkey patch
        // dropDatabase to delete all documents from all collections instead
        this.connection.db.dropDatabase = async function (): Promise<boolean> {
          const existingCollections = await this.listCollections().toArray()
          await Promise.all(
            existingCollections.map(async (collectionInfo) => {
              const collection = this.collection(collectionInfo.name)
              await collection.deleteMany({})
            }),
          )
          return true
        }
        this.connection.dropDatabase = async function () {
          await this.db?.dropDatabase()
        }
      }
    }

    // If we are running a replica set with MongoDB Memory Server,
    // wait until the replica set elects a primary before proceeding
    if (this.mongoMemoryServer) {
      this.payload.logger.info(
        'Waiting for MongoDB Memory Server replica set to elect a primary...',
      )
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    if (!this.connection.getClient().options.replicaSet) {
      this.transactionOptions = false
      this.beginTransaction = defaultBeginTransaction()
    }

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info('---- DROPPING DATABASE ----')
        await this.connection.dropDatabase()

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
      await this.migrate({ migrations: this.prodMigrations as unknown as Migration[] })
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
    throw new Error(`Error: cannot connect to MongoDB: ${msg}`)
  }
}
