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
  const id = uuid()

  const client = this.connection.getClient()
  const session = client.startSession()

  let clientSession: ClientSession
  let reject: () => void
  let resolve: () => Promise<void>

  session
    .withTransaction(
      async (tx) => {
        clientSession = tx
        await new Promise<void>((res, rej) => {
          reject = rej
          resolve = async () => {
            await clientSession.endSession()
            res()
          }
        })
      },
      options || (this.transactionOptions as TransactionOptions),
    )
    .catch((reason) => {
      this.payload.logger.error(`Transaction could not be committed: ${reason}`)
    })

  this.sessions[id] = {
    clientSession,
    reject,
    resolve,
  }

  return id
}
