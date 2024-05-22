import type { FindOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

export const findOne: FindOne = async function findOne(
  this: ExampleAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
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

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const query = {}; // Build your query here
   * ```
   */
  const query = {}

  const doc = await adapterSpecificModel.findOne(query, {}, options)

  if (!doc) {
    return null
  }

  /**
   * Convert the result to the expected document format
   *
   * This should be the shape of the data that gets returned in Payload.
   *
   * @example
   * ```ts
   * let result: Document = JSON.parse(JSON.stringify(doc))
   * ```
   */
  const result: Document = JSON.parse(JSON.stringify(doc))

  return result
}
