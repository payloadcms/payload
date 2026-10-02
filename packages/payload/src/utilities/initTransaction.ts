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
    let resolvedTransactionID: Awaited<typeof transactionID>

    try {
      resolvedTransactionID = await transactionID
    } catch (error) {
      if (req.transactionID === transactionID) {
        delete req.transactionID
      }
      throw error
    }

    if (!resolvedTransactionID && req.transactionID === transactionID) {
      delete req.transactionID
    }
    return false
  }

  if (transactionID) {
    // we already have a transaction, we're not in charge of committing it
    return false
  }
  if (typeof payload.db.beginTransaction === 'function') {
    // create a new transaction
    const pendingTransactionID = payload.db.beginTransaction()
    const pendingTransactionToken = pendingTransactionID as Promise<number | string>

    req.transactionID = pendingTransactionToken
    let resolvedTransactionID: Awaited<typeof pendingTransactionID>

    try {
      resolvedTransactionID = await pendingTransactionID
    } catch (error) {
      if (req.transactionID === pendingTransactionToken) {
        delete req.transactionID
      }
      throw error
    }

    if (!resolvedTransactionID && req.transactionID === pendingTransactionToken) {
      delete req.transactionID
    }

    if (!resolvedTransactionID) {
      return false
    }

    if (req.transactionID !== pendingTransactionToken) {
      await payload.db.rollbackTransaction(resolvedTransactionID)

      return false
    }

    req.transactionID = resolvedTransactionID

    return true
  }
  return false
}
