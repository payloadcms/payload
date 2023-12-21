import type { RollbackTransaction } from 'payload/database'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  id = '',
) {
  // if multiple operations are using the same transaction, the first will flow through and delete the session.
  // subsequent calls should be ignored.
  if (!this.sessions[id]) {
    return
  }

  // when session exists but is not inTransaction something unexpected is happening to the session
  if (!this.sessions[id].clientSession.inTransaction()) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
    delete this.sessions[id]
    return
  }

  // the first call for rollback should be aborted and deleted causing any other operations with the same transaction to fail
  await this.sessions[id].reject()
  delete this.sessions[id]
}
