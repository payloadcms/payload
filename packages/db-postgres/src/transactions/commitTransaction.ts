import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.sessions[id]) {
    this.payload.logger.warn('commitTransaction called when no transaction exists')
    return
  }

  try {
    this.sessions[id].resolve()
  } catch (err: unknown) {
    this.sessions[id].reject()
  }

  delete this.sessions[id]
}
