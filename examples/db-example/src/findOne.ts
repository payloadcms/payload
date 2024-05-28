/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FindOne } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Finds a single document in the specified collection based on the provided criteria using
 * the incoming locale and where query, and returns it in the format expected by Payload.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to reference for finding the document.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the document.
 * @returns {Promise<T>} A promise resolving to the found document or null if not found.
 */
export const findOne: FindOne = async function findOne(
  this: ExampleAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
) {
  let doc
  /**
   * Implement the logic to find one document in your database.
   *
   * @example
   * ```ts
   * const doc = await adapterSpecificModel.findOne(query, {}, options)
   * ```
   */

  if (!doc) {
    return null
  }

  /**
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
