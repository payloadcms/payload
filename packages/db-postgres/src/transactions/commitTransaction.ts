import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.sessions[id]) {
    return
  }

  try {
    this.sessions[id].resolve()
  } catch (err: unknown) {
    this.sessions[id].reject()
  }

  delete this.sessions[id]
}
