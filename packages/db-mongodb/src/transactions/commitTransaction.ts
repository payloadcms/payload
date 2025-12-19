import type { CommitTransaction } from 'payload'

import type { MongooseAdapter } from '../index.js'

export const commitTransaction: CommitTransaction = async function commitTransaction(
  this: MongooseAdapter,
  incomingID = '',
) {
  const transactionID = incomingID instanceof Promise ? await incomingID : incomingID

  if (!this.sessions[transactionID]) {
    return
  }

  if (!this.sessions[transactionID]?.inTransaction()) {
    // Clean up the orphaned session reference
    delete this.sessions[transactionID]
    return
  }

  const session = this.sessions[transactionID]

  // Delete from registry FIRST to prevent race conditions
  // This ensures other operations can't retrieve this session while we're ending it
  delete this.sessions[transactionID]

  await session.commitTransaction()
  try {
    await session.endSession()
  } catch (_) {
    // ending sessions is only best effort and won't impact anything if it fails since the transaction was committed
  }
}
