/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FindOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

export const findOne: FindOne = async function findOne(
  this: ExampleAdapter,
  {
    collection, // The name of the collection to reference for findOne
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query used to find the documents for findOne
  },
) {
  /**
   *
   * If you need to perform a find for one in your DB, here is where you'd do it
   *
   */

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
