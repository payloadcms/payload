import type { BeginTransaction } from 'payload'

import { v4 as uuid } from 'uuid'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

export const beginTransaction: BeginTransaction = async function beginTransaction(
  this: DrizzleAdapter,
  options: DrizzleAdapter['transactionOptions'],
) {
  let id
  try {
    id = uuid()

    let reject: () => Promise<void>
    let resolve: () => Promise<void>
    let transaction: DrizzleTransaction

    let transactionReady: () => void
    let transactionFailed: (err: unknown) => void
    let hasTransactionStarted = false
    const rollbackSignal = new Error('Payload transaction rollback requested')

    // Await initialization here
    // Prevent race conditions where the adapter may be
    // re-initializing, and `this.drizzle` is potentially undefined
    await this.initializing

    // Drizzle only exposes a transactions API that is sufficient if you
    // can directly pass around the `tx` argument. But our operations are spread
    // over many files and we don't want to pass the `tx` around like that,
    // so instead, we "lift" up the `resolve` and `reject` methods
    // and will call them in our respective transaction methods
    const done = this.drizzle
      .transaction(async (tx) => {
        transaction = tx
        await new Promise<void>((res, rej) => {
          resolve = () => {
            res()
            return done
          }
          reject = () => {
            rej(rollbackSignal)
            return done
          }
          transactionReady()
        })
      }, options || this.transactionOptions)
      .catch((err) => {
        if (!hasTransactionStarted) {
          // Connection failed before callback ran - reject instead of hanging forever
          transactionFailed(err)
        } else if (err !== rollbackSignal) {
          throw err
        }
      })

    // Need to wait until the transaction is ready
    // before binding its `resolve` and `reject` methods below
    await new Promise<void>((res, rej) => {
      transactionReady = () => {
        hasTransactionStarted = true
        res()
      }
      transactionFailed = rej
    })

    this.sessions[id] = {
      db: transaction,
      reject,
      resolve,
    }
  } catch (err) {
    this.payload.logger.error({ err, msg: `Error: cannot begin transaction: ${err.message}` })
    throw new Error(`Error: cannot begin transaction: ${err.message}`)
  }

  return id
}
