import type { RollbackTransaction } from 'payload/database'

export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  id = '',
) {
  if (!this.sessions[id]) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists')
    return
  }
  try {
    await this.sessions[id].reject()
  }
  delete this.sessions[id]
}
