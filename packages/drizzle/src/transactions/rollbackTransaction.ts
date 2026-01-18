import type { RollbackTransaction } from '@ruya.sa/payload'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
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
  // This ensures other operations can't retrieve this session while we're ending it
  delete this.sessions[transactionID]

  // end the session promise in failure by calling reject
  await session.reject()
}
