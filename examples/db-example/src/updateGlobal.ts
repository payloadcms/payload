/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Updates a global document in the specified collection based on the provided criteria.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} slug - The specified slug of the global.
 * @param {object} data - The full data passed to create (data will have all locales and depth 0).
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @returns {Promise<T>} A promise resolving to the updated global document.
 */
export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: ExampleAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  /**
   * Implement the logic to find one and update the document in your database.
   *
   * @example
   * ```ts
   * result = await adapterSpecificModel.findOneAndUpdate({ globalType: slug }, data, options)
   * ```
   */

  let result
  /**
   * This should be the shape of the data that gets returned in Payload when you do:
   *
   * ?depth=0&locale=all&fallbackLocale=null
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   */

  return result
}
