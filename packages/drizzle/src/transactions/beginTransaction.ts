import type { BeginTransaction } from 'payload'

import { v4 as uuid } from 'uuid'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

export const beginTransaction: BeginTransaction = async function beginTransaction(
  this: DrizzleAdapter,
  options: DrizzleAdapter['transactionOptions'],
) {
  try {
    await this.initializing

    const id = uuid()
    const rollbackSignal = new Error('Payload caller requested transaction rollback.')
    let transaction!: DrizzleTransaction
    let resolve!: () => Promise<void>
    let reject!: () => Promise<void>
    let isReady = false
    let shouldRollback = false
    let transactionReady!: () => void
    let transactionFailed!: (error: unknown) => void
    const ready = new Promise<void>((res, rej) => {
      transactionReady = res
      transactionFailed = rej
    })

    // Lift the callback boundary into the existing request-owned session without committing it.
    const done = this.drizzle
      .transaction(async (tx) => {
        transaction = tx
        await new Promise<void>((res, rej) => {
          resolve = () => {
            res()
            return done
          }
          reject = () => {
            shouldRollback = true
            rej(rollbackSignal)
            return done
          }
          isReady = true
          transactionReady()
        })
      }, options || this.transactionOptions)
      .catch((error: unknown) => {
        if (!isReady) {
          transactionFailed(error)
          return
        }

        // A native rollback failure is a different error and must still reach the owner.
        if (shouldRollback && error === rollbackSignal) {
          return
        }

        throw error
      })

    await ready
    this.sessions[id] = { db: transaction, reject, resolve }

    return id
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    this.payload.logger.error({ err, msg: `Error: cannot begin transaction: ${message}` })
    throw new Error(`Error: cannot begin transaction: ${message}`)
  }
}
