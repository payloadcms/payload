import type { RollbackTransaction } from 'payload'

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

  const session = this.sessions[transactionID]

  // Delete from registry FIRST to prevent race conditions
  // This ensures other operations can't retrieve this session while we're aborting it
  delete this.sessions[transactionID]

  if (session.inTransaction()) {
    try {
      await session.abortTransaction()
    } catch (_error) {
      // ignore the error as it is likely a race condition from multiple errors
    }
  } else {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
  }

  try {
    await session.endSession()
  } catch (_error) {
    // ending a session is best effort after its transaction has failed or been aborted
  }
}
