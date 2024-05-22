/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Create } from 'payload/database'
import type { Document, PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

import handleError from './utilities/handleError'

export const create: Create = async function create(
  this: ExampleAdapter,
  {
    collection, // The specified collection to create
    data, // The full data passed to create.
    draft, // Determine whether or not to create as a draft or not
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
  },
) {
  /**
   *
   * If you need to create a document in your DB, here is where you'd do it
   *
   */

  let doc
  try {
    /**
     * Here you would send your data to where ever it needs to go
     *
     * Implement the logic to create the document in your database.
     *
     * @example
     * ```ts
     * doc = await adapterSpecificModel.create(data, options)
     * ```
     */
  } catch (error) {
    handleError(error, req)
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
