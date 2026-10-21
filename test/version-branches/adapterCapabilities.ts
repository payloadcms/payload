import type { DatabaseAdapterType } from '../dbAdapters.js'

const hasNativeBranchTransactions = (adapter: DatabaseAdapterType): boolean =>
  adapter !== 'cosmosdb' && adapter !== 'firestore'

export const nativeBranchDatabaseOptions = { db: hasNativeBranchTransactions }

export const unsupportedBranchDatabaseOptions = {
  db: (adapter: DatabaseAdapterType): boolean => !hasNativeBranchTransactions(adapter),
}
