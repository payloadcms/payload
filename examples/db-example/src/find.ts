/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Find, PaginatedDocs } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Queries for documents in the specified collection based on the provided criteria using the incoming where,
 * sort, page query and then only return the correct documents in the format Payload expects.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to query for documents.
 * @param {number} limit - The maximum number of documents to return.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {number} page - The page number of the results to return.
 * @param {boolean} pagination - Determines whether pagination is enabled.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {string} sort - The top-level field to sort the results by.
 * @param {Where} where - The specific query used to filter documents.
 * @returns {Promise<PaginatedDocs<T>>} A promise resolving to the paginated documents matching the query criteria.
 */
export const find: Find = async function find(
  this: ExampleAdapter,
  { collection, limit, locale, page, pagination, req = {} as PayloadRequest, sort: sortArg, where },
) {
  let result
  /**
   * Implement the logic to paginate the query results according to your database's methods.
   *
   * @example
   * ```ts
   * const result = await adapterSpecificModel.paginate(query, paginationOptions)
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
  return result
}
