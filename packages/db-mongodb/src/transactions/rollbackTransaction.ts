import type { RollbackTransaction } from 'payload'

import type { MongooseAdapter } from '../index.js'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  this: MongooseAdapter,
  incomingID = '',
) {
  let transactionID: number | string

  if (incomingID instanceof Promise) {
    transactionID = await incomingID
  } else {
    transactionID = incomingID
  }

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

  // the first call for rollback should be aborted and deleted causing any other operations with the same transaction to fail
  try {
    await this.sessions[transactionID]?.abortTransaction()
    await this.sessions[transactionID]?.endSession()
  } catch (error) {
    // ignore the error as it is likely a race condition from multiple errors
  }
  delete this.sessions[transactionID]
}
