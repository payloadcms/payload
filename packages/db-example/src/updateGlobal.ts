/* eslint-disable @typescript-eslint/no-unused-vars */
import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: ExampleAdapter,
  {
    slug, // The specified slug of your global
    data, // The full data passed to update
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
  },
) {
  /**
   *
   * If you need to perform an update for a global in your DB, here is where you'd do it
   *
   */

  /**
   * Implement the logic to find one and update the document in your database.
   *
   * @example
   * ```ts
   * result = await adapterSpecificModel.findOneAndUpdate({ globalType: slug }, data, options)
   * ```
   */

  let result
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
