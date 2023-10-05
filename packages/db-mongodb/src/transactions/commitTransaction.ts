import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.sessions[id]?.inTransaction()) {
    this.payload.logger.warn('commitTransaction called when no transaction exists')
    return
  }
  await this.sessions[id].commitTransaction()
  await this.sessions[id].endSession()
  delete this.sessions[id]
}
