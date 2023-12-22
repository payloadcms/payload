import type { TransactionOptions } from 'mongodb'
import type { ClientSession } from 'mongoose'
import type { BeginTransaction } from 'payload/database'

import { v4 as uuid } from 'uuid'

import type { MongooseAdapter } from '../index'

// eslint-disable-next-line @typescript-eslint/require-await
export const beginTransaction: BeginTransaction = async function beginTransaction(
  this: MongooseAdapter,
  options: TransactionOptions,
) {
  let id
  const transactionOptions = options || this.transactionOptions || undefined
  try {
    id = uuid()
    const client = this.connection.getClient()
    const session = client.startSession()

    let reject: () => Promise<unknown>
    let resolve: () => Promise<unknown>
    let clientSession: ClientSession

    const done = session
      .withTransaction(async (tx) => {
        clientSession = tx
        await new Promise<void>((res, rej) => {
          resolve = async () => {
            res()
            return done
          }
          reject = async () => {
            rej()
            return done
          }
        })
      }, transactionOptions)
      .catch((e) => {
        // swallow
      })

    this.sessions[id] = {
      clientSession,
      reject,
      resolve,
    }
  } catch (err) {
    this.payload.logger.error(`Error: cannot begin transaction: ${err.message}`, err)
    // process.exit(1)
  }

  return id
}
