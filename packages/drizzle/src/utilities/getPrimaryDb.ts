import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

/**
 * Returns the correct database instance for reads that are part of a write operation.
 *
 * When read replicas are configured, `adapter.drizzle` is a `withReplicas` wrapper that routes
 * `select()` / `query.*` to the replica. For reads that are logically part of a write (e.g.
 * post-INSERT read-back, pre-UPDATE ID lookup, relationship deduplication), this would cause
 * replication-lag issues. This helper returns the unwrapped primary instead.
 *
 * When in a transaction, `db` is already the primary (transaction db !== adapter.drizzle),
 * so no redirection is needed. When no replicas are configured, `primaryDrizzle` is undefined
 * and `db` is returned unchanged.
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
