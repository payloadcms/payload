/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FindGlobalVersions, PaginatedDocs, TypeWithVersion } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Finds versions of a global document based on the specified criteria using the incoming global, limit, locale, page,
 * pagination, req, skip, sort, and where parameters, and returns them in the format expected by Payload.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} global - The name of the global document to reference for finding versions.
 * @param {number} limit - The maximum number of versions to return.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {number} page - The page number of the results to return.
 * @param {boolean} pagination - Determines whether pagination is enabled.
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {boolean} skip - Middleware function that can bypass the limit if it returns true.
 * @param {string} sort - The top-level field to sort the results by.
 * @param {Where} where - The specific query used to filter global versions.
 * @returns {Promise<PaginatedDocs<TypeWithVersion<T>>>} A promise resolving to the paginated versions matching the query criteria.
 */
export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: ExampleAdapter,
  {
    global,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    skip,
    sort: sortArg,
    where,
  },
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
