import type { MarkRequired } from 'ts-essentials'

import type { PayloadRequest } from '../types/index.js'

/**
 * Rollback the transaction from the req using the db adapter and removes it from the req
 * @returns true if a transaction was rolled back, false if no transaction existed
 */
export async function killTransaction(
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>,
): Promise<boolean> {
  const { payload, transactionID } = req
  if (transactionID && !(transactionID instanceof Promise)) {
    try {
      await payload.db.rollbackTransaction(req.transactionID!)
    } catch (ignore) {
      // swallow any errors while attempting to rollback
    }
    delete req.transactionID
    return true
  }
  return false
}
