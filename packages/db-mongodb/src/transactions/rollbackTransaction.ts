import type { RollbackTransaction } from 'payload/database'

export const rollbackTransaction: RollbackTransaction = function rollbackTransaction(id = '') {
  // if multiple operations are using the same transaction, the first will flow through and delete the session.
  // subsequent calls should be ignored.
  if (!this.sessions[id]) {
    return
  }

  // when session exists but inTransaction is false, it is no longer used and can be deleted
  if (!this.sessions[id].inTransaction()) {
    delete this.sessions[id]
    return
  }

  // the first call for rollback should be aborted and deleted causing any other operations with the same transaction to fail
  try {
    // null coalesce needed when rollback is called multiple times with the same id synchronously
    this.sessions?.[id].abortTransaction().then(() => {
      // not supported by DocumentDB
      this.sessions?.[id].endSession()
    })
  } catch (e) {
    // no action needed
  }
  delete this.sessions[id]
}
