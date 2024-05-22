import type { UpdateOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const updateOne: UpdateOne = async function updateOne(
  this: ExampleAdapter,
  { id, collection, data, locale, req = {} as PayloadRequest, where: whereArg },
) {
  /**
   * Implement the logic to get the adapterSpecificModel for globals from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.collections[collection]
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
   * const query = {} // Build your query here
   * ```
   */
  const query = {}

  const result = await adapterSpecificModel.findOneAndUpdate(query, data, options)

  /**
   * Convert the result to the expected document format if needed
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * const result = JSON.parse(JSON.stringify(result))
   * ```
   */

  // result = JSON.parse(JSON.stringify(result))

  return result
}
