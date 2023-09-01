import type { PayloadRequest } from '../express/types'

/**
 * Starts a new transaction using the db adapter with a random id and then assigns it to the req.transaction
 * @returns true if beginning a transaction and false when req already has a transaction to use
 */
export async function initTransaction(req: PayloadRequest): Promise<boolean> {
  const { payload, transactionID } = req
  if (!transactionID && typeof payload.db.beginTransaction === 'function') {
    req.transactionID = await payload.db.beginTransaction()
    if (req.transactionID) {
      return true
    }
  }
  return false
}
