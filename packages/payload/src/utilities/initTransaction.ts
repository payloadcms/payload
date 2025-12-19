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
    const promise = payload.db.beginTransaction()
    req.transactionID = promise as Promise<number | string>
    const transactionID = await promise

    if (typeof transactionID === 'string' || typeof transactionID === 'number') {
      req.transactionID = transactionID
    } else {
      req.transactionID = undefined
    }
    return !!req.transactionID
  }
  return false
}
