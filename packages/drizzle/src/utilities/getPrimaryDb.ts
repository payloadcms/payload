import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

/**
 * Returns the correct database instance for reads that are part of a write operation.
 */
export const getPrimaryDb = (
  adapter: DrizzleAdapter,
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction,
) => {
  if (adapter.primaryDrizzle && db === adapter.drizzle) {
    return adapter.primaryDrizzle
  }
  return db
}
