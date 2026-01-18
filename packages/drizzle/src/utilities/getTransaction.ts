import type { PayloadRequest } from '@ruya.sa/payload'

import type { DrizzleAdapter } from '../types.js'

/**
 * Returns current db transaction instance from req or adapter.drizzle itself
 *
 * If a transaction session doesn't exist (e.g., it was already committed/rolled back),
 * falls back to the default adapter.drizzle instance to prevent errors.
 */
export const getTransaction = async <T extends DrizzleAdapter = DrizzleAdapter>(
  adapter: T,
  req?: Partial<PayloadRequest>,
): Promise<T['drizzle']> => {
  if (!req?.transactionID) {
    return adapter.drizzle
  }

  return (adapter.sessions[await req.transactionID]?.db as T['drizzle']) || adapter.drizzle
}
