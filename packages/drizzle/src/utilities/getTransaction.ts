import type { PayloadRequest } from 'payload'

import type { DrizzleAdapter } from '../types.js'

/**
 * Returns current db transaction instance from req or adapter.drizzle itself
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
