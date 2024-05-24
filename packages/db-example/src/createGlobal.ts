/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CreateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Creates a global document in the database.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} slug - The specified slug of the global.
 * @param {object} data - The full data passed to create (data will have all locales and depth 0).
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @returns {Promise<T>} A promise that resolves with the created global document.
 */
export const createGlobal: CreateGlobal = async function createGlobal(
  this: ExampleAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
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
   * This should be the shape of the data that gets returned in Payload when you do:
   *
   * ?depth=0&locale=all&fallbackLocale=null
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   */

  return result
}
