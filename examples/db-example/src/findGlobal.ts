/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FindGlobal } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Finds a global document based on the specified criteria using the incoming slug, locale, and
 * where query, then returns it in the format expected by Payload.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} slug - The specified slug of the global document.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the global document.
 * @returns {Promise<T>} A promise resolving to the found global document or null if not found.
 */
export const findGlobal: FindGlobal = async function findGlobal(
  this: ExampleAdapter,
  { slug, locale, req = {} as PayloadRequest, where },
) {
  let doc
  /**
   * Implement the logic to find a global in your database.
   *
   * @example
   * ```ts
   * let doc = await adapterSpecificModel.findOne(query, {}, options)
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
   */

  return doc
}
