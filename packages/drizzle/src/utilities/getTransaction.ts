import type { PayloadRequest } from 'payload'

import type { DrizzleAdapter } from '../types.js'

import { shouldReadFromPrimary } from './readAfterWrite.js'

/**
 * Returns current db transaction instance from req or adapter.drizzle itself
 *
 * If a transaction session doesn't exist (e.g., it was already committed/rolled back),
 * falls back to the default adapter.drizzle instance to prevent errors.
 *
 * When read replicas are configured and a write happened recently, returns the
 * unwrapped primary to avoid replication-lag stale reads.
 */
export const getTransaction = async <T extends DrizzleAdapter = DrizzleAdapter>(
  adapter: T,
  req?: Partial<PayloadRequest>,
): Promise<T['drizzle']> => {
  if (!req?.transactionID) {
    if (shouldReadFromPrimary(adapter)) {
      return adapter.primaryDrizzle as T['drizzle']
    }
    return adapter.drizzle
  }

  return (adapter.sessions[await req.transactionID]?.db as T['drizzle']) || adapter.drizzle
}
