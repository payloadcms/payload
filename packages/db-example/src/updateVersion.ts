/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateVersion } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Updates a version of a document in the specified collection based on the provided criteria using
 * the incoming ID, collection, locale, and versionData, then returns the updated version in the format Payload expects.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} id - The ID of the collection document.
 * @param {string} collection - The name of the collection to reference for updating a document's version.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {object} versionData - Full version data passed to create the version.
 * @param {Where} where - The specific query used to find the documents for updating its versions.
 * @returns {Promise<TypeWithVersion<T>>} A promise resolving to the updated version document.
 */
export const updateVersion: UpdateVersion = async function updateVersion(
  this: ExampleAdapter,
  { id, collection, locale, req = {} as PayloadRequest, versionData, where },
) {
  let doc
  /**
   * Implement the logic to update a document's version in your database.
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
