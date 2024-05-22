import type { CreateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: ExampleAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  /**
   * Implement the logic to get the adapterSpecificModel for globals from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.globals;
   * ```
   */
  let adapterSpecificModel

  // Construct the global data object
  const global = {
    globalType: slug,
    ...data,
  }

  // Replace this with your session handling or remove if not needed
  const options = {}

  let result
  /**
   * Implement the logic to create the global document in your database.
   *
   * @example
   * ```ts
   * result = await adapterSpecificModel.create(global, options);
   * ```
   */
  result = await adapterSpecificModel.create(global, options)

  /**
   * Convert the result to the expected document format
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * result = JSON.parse(JSON.stringify(result))
   * ```
   */

  return result
}
