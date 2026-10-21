import type { CommitTransaction } from 'payload'

export const commitTransaction: CommitTransaction = async function commitTransaction(
  incomingID = '',
) {
  const transactionID = incomingID instanceof Promise ? await incomingID : incomingID
  const session = this.sessions[transactionID]

  if (!session) {
    return
  }

  delete this.sessions[transactionID]

  try {
    await session.resolve()
  } catch (error) {
    try {
      await session.reject()
    } catch {
      // The commit error describes the failed outcome even when cleanup also fails.
    }

    throw error
  }
}
