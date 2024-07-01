import type { RollbackTransaction } from 'payload'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  incomingID = '',
) {
  const transactionID = incomingID instanceof Promise ? await incomingID : incomingID

  // if multiple operations are using the same transaction, the first will flow through and delete the session.
  // subsequent calls should be ignored.
  if (!this.sessions[transactionID]) {
    return
  }

  // end the session promise in failure by calling reject
  await this.sessions[transactionID].reject()

  // delete the session causing any other operations with the same transaction to fail
  delete this.sessions[transactionID]
}
