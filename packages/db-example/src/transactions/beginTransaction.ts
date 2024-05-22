import type { TransactionOptions } from 'mongodb'
import type { BeginTransaction } from 'payload/database'

import type { ExampleAdapter } from '../index'

export const beginTransaction: BeginTransaction = async function beginTransaction(
  this: ExampleAdapter,
  options: TransactionOptions,
) {
  // if you want to support db transactions, you would initialize them here

  // alternatively do nothing

  return null
}
