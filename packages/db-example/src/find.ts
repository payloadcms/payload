/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Find } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const find: Find = async function find(
  this: ExampleAdapter,
  {
    collection, // The name of the collection to reference for find
    limit, // Value of the amount of docs to find
    locale, // The locale being used - you can only create docs in one locale at a time
    page, // Current page to query from
    pagination, // Boolean value determining if pagination is enabled
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    sort: sortArg, // Top-level field to sort by
    where, // The specific query used to find the documents for find
  },
) {
  /**
   *
   * If you need to perform a find to a DB, here is where you'd do it
   *
   */

  let result
  /**
   * Implement the logic to paginate the query results according to your database's methods.
   *
   * @example
   * ```ts
   * const result = await adapterSpecificModel.paginate(query, paginationOptions)
   * ```
   */

  let docs
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
  // const docs = result.docs

  return {
    ...result,
    docs: docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc.id = doc._id // Adjust this line according to your database's ID field
      /**
       * If needed, implement logic to sanitize internal fields of the document.
       * This might be necessary to remove any database-specific metadata.
       *
       * @example
       * ```ts
       * doc = sanitizeInternalFields(doc)
       * ```
       */
      return doc
    }),
  }
}
