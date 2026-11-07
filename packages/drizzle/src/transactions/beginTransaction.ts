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

    // Set once `resolve` is called, so that an error thrown by the COMMIT can be
    // told apart from a connection error that happened before the callback ran.
    let committing = false
    let commitError: { error: unknown } | undefined

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
          resolve = async () => {
            committing = true
            res()
            await done
            if (commitError) {
              throw commitError.error
            }
          }
          reject = () => {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            rej()
            return done
          }
          transactionReady()
        })
      }, options || this.transactionOptions)
      .catch((err) => {
        // The database refused the COMMIT (e.g. a deferred constraint, a
        // serialization failure or a dropped connection). Drizzle has already
        // rolled back, so keep the error and surface it from `resolve`.
        if (committing) {
          commitError = { error: err ?? new Error('The transaction could not be committed') }
          return
        }

        // Connection failed before callback ran - reject instead of hanging forever
        transactionFailed(err)
      })

    // Need to wait until the transaction is ready
    // before binding its `resolve` and `reject` methods below
    await new Promise<void>((res, rej) => {
      transactionReady = res
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
