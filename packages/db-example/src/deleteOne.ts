/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteOne: DeleteOne = async function deleteOne(
  this: ExampleAdapter,
  {
    collection, // The name of the collection to reference for deleting a document
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query used to find the documents for deleting
  },
) {
  /**
   *
   * If you need to perform a delete in your DB, here is where you'd do it
   *
   */

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
   * Convert the result to the expected document format
   *
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
