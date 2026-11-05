import type { DrizzleAdapter } from '../types.js'

/**
 * Tracks the last write timestamp on the adapter so that reads within a
 * configurable window after a write are routed to the primary instead of a
 * read replica.
 *
 * This avoids stale-read issues caused by replication lag when application
 * code writes then immediately reads (e.g. create → findByID).
 */

/** Call after any successful write to mark the adapter. */
export function markWrite(adapter: DrizzleAdapter): void {
  adapter.lastWriteTimestamp = Date.now()
}

/**
 * Returns true when a recent write happened and reads should be routed to the
 * primary to guarantee read-after-write consistency.
 */
export function shouldReadFromPrimary(adapter: DrizzleAdapter): boolean {
  if (!adapter.primaryDrizzle || !adapter.lastWriteTimestamp) {
    return false
  }
  return Date.now() - adapter.lastWriteTimestamp < adapter.readReplicasAfterWriteInterval
}
