import type { RollbackTransaction } from 'payload/database'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  id = '',
) {
  if (!this.sessions[id]?.inTransaction()) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
    delete this.sessions[id]
    return
  }
  await this.sessions[id]?.abortTransaction()
  await this.sessions[id]?.endSession()
  delete this.sessions[id]
}
