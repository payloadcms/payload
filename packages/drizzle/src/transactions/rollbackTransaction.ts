import type { RollbackTransaction } from 'payload'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  id = '',
) {
  // if multiple operations are using the same transaction, the first will flow through and delete the session.
  // subsequent calls should be ignored.
  if (!this.sessions[id]) {
    return
  }

  // end the session promise in failure by calling reject
  await this.sessions[id].reject()

  // delete the session causing any other operations with the same transaction to fail
  delete this.sessions[id]
}
