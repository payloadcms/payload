/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CreateGlobalVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Creates a global version document in the database.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {boolean} autosave - Indicates if autosave is enabled.
 * @param {Date} createdAt - Created-At date of the document.
 * @param {string} globalSlug - The global slug of the document.
 * @param {string} parent - ID of the parent document for which the version should be created for.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Date} updatedAt - Updated-At date of the document.
 * @param {object} versionData - Full version data passed to create the global version.
 * @returns {Promise<TypeWithVersion<T>>} A promise that resolves with the created global version document.
 */
export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: ExampleAdapter,
  { autosave, createdAt, globalSlug, parent, req = {} as PayloadRequest, updatedAt, versionData },
) {
  let doc
  /**
   * Implement the logic to create the global version document in your database.
   *
   * @example
   * ```ts
   * doc = await adapterSpecificVersionModel.create({
   *   autosave,
   *   createdAt,
   *   latest: true,
   *   parent,
   *   updatedAt,
   *   version: versionData,
   * }, options, req)
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
  const result: Document = doc

  return result
}
