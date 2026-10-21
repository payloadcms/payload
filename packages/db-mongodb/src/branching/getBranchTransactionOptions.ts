import type { TransactionOptions } from 'mongodb'

import { ReadConcern } from 'mongodb'

import type { MongooseAdapter } from '../index.js'

/** Fill omitted guarantees for the experimental branch graph without changing explicit choices. */
export const getBranchTransactionOptions = ({
  adapter,
  options,
}: {
  adapter: MongooseAdapter
  options?: TransactionOptions
}): TransactionOptions | undefined => {
  if (adapter.transactionOptions === false) {
    return options
  }
  const configured = options || adapter.transactionOptions
  const hasBranchQueries = Object.values(adapter.payload.collections).some(
    ({ config }) => config.custom?.branchQueryStorage,
  )

  if (!hasBranchQueries) {
    return configured
  }
  return {
    ...configured,
    readConcern:
      typeof configured?.readConcern === 'string'
        ? configured.readConcern
        : configured?.readConcern?.level
          ? configured.readConcern
          : new ReadConcern('snapshot'),
    writeConcern: { ...configured?.writeConcern, w: configured?.writeConcern?.w ?? 'majority' },
  }
}
