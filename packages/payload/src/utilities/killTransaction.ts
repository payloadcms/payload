import type { MarkRequired } from 'ts-essentials'

import type { PayloadRequest } from '../types/index.js'

import { resetBranchState } from '../branching/resolveBranch.js'
import {
  clearTransactionCommitCallbacks,
  clearTransactionRollbackCallbacks,
  runTransactionRollbackCallbacks,
} from './transactionCallbacks.js'

/**
 * Rollback the transaction from the req using the db adapter and removes it from the req
 *
 * Only call this from an operation that owns the transaction, i.e. one whose own
 * `initTransaction` call returned `true`. Operations that never open a transaction —
 * every read operation — must not call this: `req` is shared with the caller, so rolling
 * back here discards the caller's in-flight writes. If that caller catches the error
 * (a hook tolerating a missing doc, for example) it goes on to commit a transaction that
 * no longer exists, and the write is lost with no error surfaced.
 */
export async function killTransaction(
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>,
): Promise<void> {
  const { payload, transactionID } = req
  if (transactionID && !(transactionID instanceof Promise)) {
    let didRollBack = false

    try {
      await payload.db.rollbackTransaction(req.transactionID!)
      didRollBack = true
    } catch (ignore) {
      // swallow any errors while attempting to rollback
    }
    delete req.transactionID
    clearTransactionCommitCallbacks({ req, transactionID })

    if (didRollBack) {
      try {
        await runTransactionRollbackCallbacks({ req, transactionID })
      } catch (err) {
        payload.logger.error({ err, msg: 'A post-rollback callback failed.' })
      }
    } else {
      clearTransactionRollbackCallbacks({ req, transactionID })
    }

    resetBranchState(req as PayloadRequest)
  }
}
