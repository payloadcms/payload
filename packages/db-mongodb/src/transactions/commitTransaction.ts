import type { ClientSession } from 'mongodb'
import type { CommitTransaction } from 'payload'

import type { MongooseAdapter } from '../index.js'

const unknownCommitRetryTimeoutMilliseconds = 120_000
const unknownCommitRetryInitialDelayMilliseconds = 5
const unknownCommitRetryMaximumDelayMilliseconds = 500
const unknownCommitRetryGrowth = 1.5

export const commitTransaction: CommitTransaction = async function commitTransaction(
  this: MongooseAdapter,
  incomingID = '',
) {
  const transactionID = incomingID instanceof Promise ? await incomingID : incomingID

  if (!this.sessions[transactionID]) {
    return
  }

  if (!this.sessions[transactionID]?.inTransaction()) {
    await endRegisteredSession({
      adapter: this,
      session: this.sessions[transactionID],
      transactionID,
    })
    return
  }

  const session = this.sessions[transactionID]
  const retryDeadline = Date.now() + unknownCommitRetryTimeoutMilliseconds
  let retryIndex = 0

  while (true) {
    try {
      await session.commitTransaction()
      await endRegisteredSession({ adapter: this, session, transactionID })
      return
    } catch (error) {
      if (!isUnknownTransactionCommitResult(error)) {
        throw error
      }

      const retryDelayMilliseconds =
        Math.random() *
        Math.min(
          unknownCommitRetryInitialDelayMilliseconds * unknownCommitRetryGrowth ** retryIndex,
          unknownCommitRetryMaximumDelayMilliseconds,
        )

      if (isMaxTimeExpiredError(error) || Date.now() + retryDelayMilliseconds >= retryDeadline) {
        await endRegisteredSession({ adapter: this, session, transactionID })
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelayMilliseconds))
      retryIndex += 1
    }
  }
}

const endRegisteredSession = async ({
  adapter,
  session,
  transactionID,
}: {
  adapter: MongooseAdapter
  session: ClientSession
  transactionID: number | string
}): Promise<void> => {
  delete adapter.sessions[transactionID]

  try {
    await session.endSession()
  } catch (_) {
    // Ending the session is best effort after commit succeeds or its result remains unknown.
  }
}

const isMaxTimeExpiredError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const mongoError = error as { code?: number; codeName?: string }

  return mongoError.code === 50 || mongoError.codeName === 'MaxTimeMSExpired'
}

const isUnknownTransactionCommitResult = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const labeledError = error as {
    errorLabels?: string[]
    hasErrorLabel?: (label: string) => boolean
  }

  return (
    labeledError.hasErrorLabel?.('UnknownTransactionCommitResult') === true ||
    labeledError.errorLabels?.includes('UnknownTransactionCommitResult') === true
  )
}
