import type { MarkRequired } from 'ts-essentials'

import type { PayloadRequest } from '../types/index.js'

import {
  clearTransactionCommitCallbacks,
  clearTransactionRollbackCallbacks,
  runTransactionCommitCallbacks,
} from './transactionCallbacks.js'

export const isUnknownTransactionCommitResult = (error: unknown): boolean => {
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

export const shouldRollbackTransactionArtifacts = ({ error }: { error: unknown }): boolean =>
  !isUnknownTransactionCommitResult(error)

/**
 * complete a transaction calling adapter db.commitTransaction and delete the transactionID from req
 */
export async function commitTransaction(
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>,
): Promise<void> {
  const { payload, transactionID } = req
  const resolvedTransactionID = await transactionID!

  try {
    await payload.db.commitTransaction(resolvedTransactionID)
  } catch (error) {
    if (isUnknownTransactionCommitResult(error)) {
      delete req.transactionID
      clearTransactionCommitCallbacks({ req, transactionID: resolvedTransactionID })
      clearTransactionRollbackCallbacks({ req, transactionID: resolvedTransactionID })
    }

    throw error
  }

  delete req.transactionID
  clearTransactionRollbackCallbacks({ req, transactionID: resolvedTransactionID })

  try {
    await runTransactionCommitCallbacks({ req, transactionID: resolvedTransactionID })
  } catch (err) {
    payload.logger.error({ err, msg: 'A post-commit cleanup task failed.' })
  }
}
