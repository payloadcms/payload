/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CommitTransaction } from 'payload/database'

/**
 * Commits a transaction identified by its ID.
 *
 * Optional - this method is not required
 *
 * @param {string} id - The ID of the transaction to commit.
 * @returns {Promise<void>}
 *
 * This function is optional and can be implemented as needed for database adapters that support transactions.
 */
export const commitTransaction: CommitTransaction = async function commitTransaction(id) {}
