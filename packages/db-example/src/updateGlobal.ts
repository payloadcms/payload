import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: ExampleAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  /**
   * Implement the logic to get the adapterSpecificModel for globals from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.globals
   * ```
   */
  let adapterSpecificModel

  // Replace this with your session handling or remove if not needed
  const options = {}

  /**
   * Implement the logic to find one and update the document in your database.
   *
   * @example
   * ```ts
   * result = await adapterSpecificModel.findOneAndUpdate({ globalType: slug }, data, options)
   * ```
   */
  const result = await adapterSpecificModel.findOneAndUpdate({ globalType: slug }, data, options)

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

  return result
}
