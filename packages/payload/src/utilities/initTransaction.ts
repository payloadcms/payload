// @ts-strict-ignore
import type { MarkRequired } from 'ts-essentials'

import type { PayloadRequest } from '../types/index.js'

/**
 * Starts a new transaction using the db adapter with a random id and then assigns it to the req.transaction
 * @returns true if beginning a transaction and false when req already has a transaction to use
 */
export async function initTransaction(
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>,
): Promise<boolean> {
  const { payload, transactionID } = req
  if (transactionID instanceof Promise) {
    // wait for whoever else is already creating the transaction
    await transactionID
    return false
  }

  if (transactionID) {
    // we already have a transaction, we're not in charge of committing it
    return false
  }
  if (typeof payload.db.beginTransaction === 'function') {
    // create a new transaction
    req.transactionID = payload.db.beginTransaction().then((transactionID) => {
      if (transactionID) {
        req.transactionID = transactionID
      }

      return transactionID
    })
    return !!(await req.transactionID)
  }
  return false
}
