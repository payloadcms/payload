/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const updateOne: UpdateOne = async function updateOne(
  this: ExampleAdapter,
  {
    id, // ID of the collection document
    collection, // The name of the collection to reference for updating one
    data, // The full data passed to update
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where: whereArg, // The specific query used to find the documents for updating
  },
) {
  /**
   *
   * If you need to perform an update in your DB, here is where you'd do it
   *
   */

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
   * Convert the result to the expected document format
   *
   * This should be the shape of the data that gets returned in Payload when you do:
   *
   * ?depth=0&locale=all&fallbackLocale=null
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   */

  return result
}
