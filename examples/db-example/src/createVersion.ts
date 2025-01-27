/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CreateVersion, TypeWithVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Creates a version document in the database.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {boolean} autosave - Indicates if autosave is enabled.
 * @param {string} collectionSlug - The collection slug of the document.
 * @param {Date} createdAt - Created-At date of the document.
 * @param {string} parent - ID of the parent document for which the version should be created for.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Date} updatedAt - Updated-At date of the document.
 * @param {object} versionData - Full version data passed to create the version.
 * @returns {Promise<TypeWithVersion<T>>} A promise that resolves with the created version document.
 *
 */
export const createVersion: CreateVersion = async function createVersion(
  this: ExampleAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    req = {} as PayloadRequest,
    updatedAt,
    versionData,
  },
) {
  let doc
  /**
   * Implement the logic to create the version document in your database.
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
