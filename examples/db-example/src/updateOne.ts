/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateOne } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Updates a single document in the specified collection based on the provided criteria using
 * the incoming ID, collection, locale, and data, then returns the updated document in the format Payload expects.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} id - The ID of the collection document.
 * @param {string} collection - The name of the collection to reference for updating one.
 * @param {object} data - The full data passed to create (data will have all locales and depth 0).
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the documents for updating.
 * @returns {Promise<Document>} A promise resolving to the updated document.
 */
export const updateOne: UpdateOne = async function updateOne(
  this: ExampleAdapter,
  { id, collection, data, locale, req = {} as PayloadRequest, where },
) {
  let result
  /**
   * Implement the logic to update one document in your database.
   *
   * @example
   * ```ts
   * const result = await adapterSpecificModel.findOneAndUpdate(query, data, options)
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

  return result
}
