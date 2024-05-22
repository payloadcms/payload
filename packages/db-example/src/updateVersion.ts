/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: ExampleAdapter,
  {
    id, // ID of the collection document
    collection, // The name of the collection to reference for updating a documents version
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    versionData, // Full version data passed to create the version
    where, // The specific query used to find the documents for updating its versions
  },
) {
  /**
   *
   * If you need to perform an update of a version in your DB, here is where you'd do it
   *
   */

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
   * Convert the result to the expected document format
   *
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
