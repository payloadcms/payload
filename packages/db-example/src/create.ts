import type { Create } from 'payload/database'
import type { Document, PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

import handleError from './utilities/handleError'

export const create: Create = async function create(
  this: ExampleAdapter,
  { collection, data, req = {} as PayloadRequest },
) {
  /**
   * Implement the logic to get the adapterSpecificModel from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.collections[collection];
   * ```
   */
  let adapterSpecificModel

  // Replace this with your session handling or remove if not needed
  const options = {}
  let doc
  try {
    /**
     * Here you would send your data to where ever it needs to go
     *
     * Implement the logic to create the document in your database.
     *
     * @example
     * ```ts
     * doc = await adapterSpecificModel.create(data, options);
     * ```
     */
    doc = await adapterSpecificModel.create(data, options)
  } catch (error) {
    handleError(error, req)
  }

  /**
   * Convert the result to the expected document format
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * const result: Document = JSON.parse(JSON.stringify(doc))
   * ```
   */
  const result: Document = doc

  return result
}
