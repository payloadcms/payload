/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TransactionOptions } from 'mongodb'
import type { BeginTransaction } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '../index'

/**
 * Begins a new transaction with the provided options.
 *
 * If you want to support database transactions, you would initialize them within this function.
 * Alternatively, if transactions are not supported or not needed, this function can do nothing and return null.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {TransactionOptions} options - The options for the transaction.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @returns {Promise<null>} A promise resolving to null.
 *
 * This function is optional and can be implemented as needed for database adapters that support transactions.
 */
export const beginTransaction: BeginTransaction = async function beginTransaction(
  this: ExampleAdapter,
  options: TransactionOptions,
  req: PayloadRequest,
) {
  return null
}
