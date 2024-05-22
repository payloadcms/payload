/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CreateGlobalVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: ExampleAdapter,
  {
    autosave, // If autosave is enabled or not
    createdAt, // Created-At date
    globalSlug,
    parent, // ID of the parent document for which the version should be created for
    req = {} as PayloadRequest,
    updatedAt, // Updated-At date
    versionData, // Full version data passed to create the global version
  },
) {
  /**
   *
   * If you need to create a global version in your DB, here is where you'd do it
   *
   */
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
   * Convert the result to the expected document format
   *
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
