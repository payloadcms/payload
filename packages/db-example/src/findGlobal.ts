/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FindGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const findGlobal: FindGlobal = async function findGlobal(
  this: ExampleAdapter,
  {
    slug, // The specified slug of your global
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query for querying the global in question to find
  },
) {
  /**
   *
   * If you need to perform a find for a global in your DB, here is where you'd do it
   *
   */

  let doc
  /**
   * Implement the logic to find a global in your database.
   *
   * @example
   * ```ts
   * let doc = await adapterSpecificModel.findOne(query, {}, options)
   * ```
   */

  if (!doc) {
    return null
  }

  /**
   * Convert the doc to the expected document format
   *
   * This should be the shape of the data that gets returned in Payload when you do:
   *
   * ?depth=0&locale=all&fallbackLocale=null
   *
   */

  return doc
}
