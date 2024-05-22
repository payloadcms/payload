/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateGlobalVersionArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { ExampleAdapter } from '.'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: ExampleAdapter,
  {
    id, // ID of the global version
    global, // The name of the global to reference for updating a Global's version
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    versionData, // Full version data passed to update the global version
    where, // The specific query for querying the global version documents in question to update
  }: UpdateGlobalVersionArgs<T>,
) {
  /**
   *
   * If you need to perform an update for a global version in your DB, here is where you'd do it
   *
   */

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
