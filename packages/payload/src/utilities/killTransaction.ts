import type { PayloadRequest } from '../types/index.js'

/**
 * Rollback the transaction from the req using the db adapter and removes it from the req
 */
export async function killTransaction(req: PayloadRequest): Promise<void> {
  const { payload, transactionID } = req
  if (transactionID && !(transactionID instanceof Promise)) {
    try {
      await payload.db.rollbackTransaction(req.transactionID)
    } catch (error) {
      // swallow any errors while attempting to rollback
    }
    delete req.transactionID
  }
}
