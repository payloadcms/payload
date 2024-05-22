import type { DeleteOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'

export const deleteOne: DeleteOne = async function deleteOne(
  this: ExampleAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  /**
   * Implement the logic to get the adapterSpecificModel from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.collections[collection]
   * ```
   */
  let adapterSpecificModel

  // Replace this with your session handling or remove if not needed
  const options = {}

  // Implement the query building logic according to your database syntax.
  const query = {}

  /**
   * Need to go delete your document through the API
   *
   * Implement the logic to delete the document from your database.
   *
   * @example
   * ```ts
   * const doc = await adapterSpecificModel.delete(query, options)
   * ```
   */

  const doc = await adapterSpecificModel.delete(query, options)

  /**
   * Convert the result to the expected document format
   *
   * This should be the shape of the data that gets returned in Payload when you do:
   *
   * ?depth=0&locale=all&fallbackLocale=null
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * let result: Document = JSON.parse(JSON.stringify(doc))
   * ```
   */
  let result: Document = doc
  result = sanitizeInternalFields(result)
  return result
}
