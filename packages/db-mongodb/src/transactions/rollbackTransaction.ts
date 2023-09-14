import type { RollbackTransaction } from 'payload/database'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  id = '',
) {
  if (!this.session[id]?.inTransaction()) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
    return
  }
  await this.session[id].abortTransaction()
  await this.session[id].endSession()
  delete this.session[id]
}
