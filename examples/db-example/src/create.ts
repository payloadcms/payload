/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Create } from 'payload/database'
import type { Document, PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

import handleError from './errors/handleError'

/**
 * Creates a new document in the specified collection.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to reference for creating documents.
 * @param {object} data - The full data passed to create (data will have all locales and depth 0).
 * @param {boolean} draft - Determine whether or not to create as a draft or not.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @returns {Promise<Document>} A promise resolving to the created document.
 */
export const create: Create = async function create(
  this: ExampleAdapter,
  { collection, data, draft, locale, req = {} as PayloadRequest },
) {
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
