/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteVersions } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Deletes many version documents from your database.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to reference for deleting versions.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the documents for deleting versions.
 * @returns {Promise<void>} A promise that resolves with the created global document.
 */
export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: ExampleAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
) {
  /**
   * Implement the logic to delete many version documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificVersionsModel.deleteMany(query, options)
   * ```
   */
}
