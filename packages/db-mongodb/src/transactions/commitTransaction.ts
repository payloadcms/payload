import type { ClientSession } from 'mongoose'
import type { CommitTransaction } from 'payload/database'

import { APIError } from 'payload/errors'

// eslint-disable-next-line @typescript-eslint/require-await
export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.sessions[id]) {
    // either transactions aren't being used (no replicaSet) or it was already aborted from an error elsewhere
    return
  }

  const session = this.sessions[id] as ClientSession

  if (!session.inTransaction()) {
    // session was expecting to be in a healthy state but is not
    throw new APIError('commitTransaction called when no transaction exists')
  }

  await session.commitTransaction().catch((reason) => {
    throw new APIError(`transaction could not be committed: ${reason}`)
  })

  await session.endSession()
  delete this.sessions[id]
}
