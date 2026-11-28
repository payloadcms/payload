import type { PayloadRequest } from 'payload'

import type { DrizzleAdapter } from '../types.js'

import { shouldReadFromPrimary } from './readAfterWrite.js'

/**
 * Returns current db transaction instance from req or adapter.drizzle itself.
 *
 * Throws if req.transactionID resolves to a transaction ID whose session no longer exists
 * (e.g., it was already committed or rolled back) instead of falling back to autocommit
 * on adapter.drizzle.
 *
 * When read replicas are configured and a write happened recently, returns the
 * unwrapped primary to avoid replication-lag stale reads.
 */
export const getTransaction = async <T extends DrizzleAdapter = DrizzleAdapter>(
  adapter: T,
  req?: Partial<PayloadRequest>,
): Promise<T['drizzle']> => {
  const transactionID = req?.transactionID !== undefined ? await req.transactionID : undefined

  if (transactionID === undefined || transactionID === null || transactionID === '') {
    if (shouldReadFromPrimary(adapter)) {
      return adapter.primaryDrizzle
    }
    return adapter.drizzle
  }

  const session = adapter.sessions[transactionID]

  if (!session?.db) {
    throw new Error(`Transaction ${transactionID} is no longer active.`)
  }

  return session.db as T['drizzle']
}
