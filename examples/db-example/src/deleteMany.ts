/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteMany } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Deletes multiple documents from the specified collection in the database.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to reference for deleting documents.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the documents for deleting.
 * @returns {Promise<void>} A promise that resolves when the documents are deleted.
 */
export const deleteMany: DeleteMany = async function deleteMany(
  this: ExampleAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  /**
   * Implement the logic to delete many documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificModel.deleteMany(query, options)
   * ```
   */
}
