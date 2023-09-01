import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.connection.get('replicaSet')) {
    return
  }
  if (!this.session[id]?.inTransaction()) {
    this.payload.logger.warn('commitTransaction called when no transaction exists')
    return
  }
  await this.session[id].commitTransaction()
  await this.session[id].endSession()
  delete this.session[id]
}
