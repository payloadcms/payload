import type { RollbackTransaction } from '@ruya.sa/payload'

import type { MongooseAdapter } from '../index.js'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  this: MongooseAdapter,
  incomingID = '',
) {
  const transactionID = incomingID instanceof Promise ? await incomingID : incomingID

  // if multiple operations are using the same transaction, the first will flow through and delete the session.
  // subsequent calls should be ignored.
  if (!this.sessions[transactionID]) {
    return
  }

  // when session exists but is not inTransaction something unexpected is happening to the session
  if (!this.sessions[transactionID]?.inTransaction()) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
    delete this.sessions[transactionID]
    return
  }

  const session = this.sessions[transactionID]

  // Delete from registry FIRST to prevent race conditions
  // This ensures other operations can't retrieve this session while we're aborting it
  delete this.sessions[transactionID]

  // the first call for rollback should be aborted and deleted causing any other operations with the same transaction to fail
  try {
    await session.abortTransaction()
    await session.endSession()
  } catch (_error) {
    // ignore the error as it is likely a race condition from multiple errors
  }
}
