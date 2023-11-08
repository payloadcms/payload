import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.sessions[id]?.inTransaction()) {
    return
  }

  await this.sessions[id].commitTransaction()
  await this.sessions[id].endSession()
  delete this.sessions[id]
}
