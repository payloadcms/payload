import type { RollbackTransaction } from 'payload/database'

/**
 * Rolls back a transaction identified by its ID.
 *
 * @param {string} id - The ID of the transaction to rollback.
 * @returns {Promise<void>}
 *
 * This function is optional and can be implemented as needed for database adapters that support transactions.
 */
export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id = '',
) {}
