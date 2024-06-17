import type { RollbackTransaction } from 'payload'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  id = '',
) {
  // if multiple operations are using the same transaction, the first will flow through and delete the session.
  // subsequent calls should be ignored.
  if (!this.sessions[id]) {
    return
  }

  // when session exists but is not inTransaction something unexpected is happening to the session
  if (!this.sessions[id].inTransaction()) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
    delete this.sessions[id]
    return
  }

  // the first call for rollback should be aborted and deleted causing any other operations with the same transaction to fail
  try {
    await this.sessions[id].abortTransaction()
    await this.sessions[id].endSession()
  } catch (error) {
    // ignore the error as it is likely a race condition from multiple errors
  }
  delete this.sessions[id]
}
