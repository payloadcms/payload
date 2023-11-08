import type { CommitTransaction } from 'payload/database'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  // if the session was deleted it has already been aborted
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
