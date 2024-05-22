import type { UpdateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: ExampleAdapter,
  { id, collection, locale, req = {} as PayloadRequest, versionData, where },
) {
  /**
   * Implement the logic to get the adapterSpecificModel for globals from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.versions[collection]
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

  const doc = await adapterSpecificModel.findOneAndUpdate(query, versionData, options)

  /**
   * Convert the result to the expected document format if needed
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * const result = JSON.parse(JSON.stringify(doc))
   * ```
   */

  const result = doc

  return result
}
