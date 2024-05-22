/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CreateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: ExampleAdapter,
  {
    slug, // The specified slug of the global
    data, // The full data passed to create
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
  },
) {
  /**
   *
   * If you need to create a global in your DB, here is where you'd do it
   *
   */

  let result
  /**
   * Implement the logic to create the global document in your database.
   *
   * @example
   * ```ts
   * result = await adapterSpecificModel.create(global, options)
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
