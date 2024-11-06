import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (id instanceof Promise) return

  if (!this.sessions[id]?.inTransaction()) {
    return
  }

  await this.sessions[id].commitTransaction()
  try {
    await this.sessions[id].endSession()
  } catch (error) {
    // ending sessions is only best effort and won't impact anything if it fails since the transaction was committed
  }
  delete this.sessions[id]
}
