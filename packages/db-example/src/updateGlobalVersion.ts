/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateGlobalVersionArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Updates a global version document in the specified collection based on the provided criteria using
 * the incoming ID, global, locale, and versionData, then returns the updated global version document in the format Payload expects.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} id - The ID of the global version.
 * @param {string} global - The name of the global to reference for updating a global's version.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {object} versionData - Full version data passed to update the global version.
 * @param {Where} where - The specific query for querying the global version documents in question to update.
 * @returns {Promise<any>} A promise resolving to the updated global version document.
 */
export async function updateGlobalVersion<T extends TypeWithID>(
  this: ExampleAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequest,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  let doc
  /**
   * Implement the logic to find one and update the document in your database.
   *
   * @example
   * ```ts
   * const doc = await adapterSpecificModel.findOneAndUpdate(query, versionData, options)
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
  const result = doc

  return result
}
