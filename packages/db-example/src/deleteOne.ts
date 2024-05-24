/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteOne } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Deletes a single document from the specified collection in the database.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to reference for deleting a document.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the document for deleting.
 * @returns {Promise<Document>} A promise that resolves with the deleted document.
 */
export const deleteOne: DeleteOne = async function deleteOne(
  this: ExampleAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  let doc
  /**
   * Need to go delete your document through the API
   *
   * Implement the logic to delete the document from your database.
   *
   * @example
   * ```ts
   * doc = await adapterSpecificModel.delete(query, options)
   * ```
   */

  /**
   * This should be the shape of the data that gets returned in Payload when you do:
   *
   * ?depth=0&locale=all&fallbackLocale=null
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   */
  const result: Document = doc
  return result
}
